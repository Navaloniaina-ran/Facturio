import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { InvoiceService } from './invoice.service';
import { InvoicesComponent } from './invoices.component';

describe('InvoicesComponent', () => {
  /** Le filtre initial provient de l'URL : on passe par une vraie navigation. */
  async function create(status: string | null = null) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'createur/factures', component: InvoicesComponent }])],
    });
    TestBed.inject(I18nService).setLanguage('fr');

    const harness = await RouterTestingHarness.create(
      status ? `/createur/factures?statut=${status}` : '/createur/factures',
    );
    await harness.fixture.whenStable();
    return harness.fixture;
  }

  it('shows the summary and the invoice list', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Facturé');
    expect(text).toContain('FAC-2026-0001');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(
      TestBed.inject(InvoiceService).list().length,
    );
  });

  it('applies the status filter coming from the dashboard', async () => {
    const fixture = await create('OVERDUE');
    const expected = TestBed.inject(InvoiceService).overdue().length;

    expect(expected).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(expected);
    expect(fixture.nativeElement.textContent).toContain('FAC-2026-0002');
  });

  it('searches by invoice number', async () => {
    const fixture = await create();
    const field = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;

    field.value = 'FAC-2026-0003';
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('opens the creation form with live totals', async () => {
    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Nouvelle facture'),
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Total TTC');
  });

  it('asks for confirmation in a modal before issuing a credit note', async () => {
    const fixture = await create('PAID');
    const service = TestBed.inject(InvoiceService);
    const target = service.list().find((invoice) => invoice.status === 'PAID')!;

    // 1. « Avoir » est une action secondaire : elle vit dans le menu de
    //    débordement de la ligne. L'ouvrir ne génère toujours rien.
    const openCredit = async () => {
      const trigger = fixture.nativeElement.querySelector(
        'tbody app-action-menu button[aria-haspopup="menu"]',
      ) as HTMLButtonElement;
      trigger.click();
      await fixture.whenStable();

      const entry = [...fixture.nativeElement.querySelectorAll('tbody .action-menu-item')].find(
        (item) => item.textContent?.trim() === 'Avoir',
      ) as HTMLButtonElement;
      entry.click();
      await fixture.whenStable();
    };

    await openCredit();

    const modal = fixture.nativeElement.querySelector('app-modal') as HTMLElement;
    expect(modal.textContent).toContain('Générer un avoir');
    expect(modal.textContent).toContain(target.number);
    expect(modal.textContent).toContain('Total TTC');
    expect(service.byId(target.id)?.status).toBe('PAID');

    // 2. « Annuler » referme la modale sans effet.
    const cancelButton = [...modal.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Annuler',
    ) as HTMLButtonElement;
    cancelButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-modal')).toBeNull();
    expect(service.byId(target.id)?.status).toBe('PAID');

    // 3. La confirmation crée l'avoir et annule la facture d'origine.
    await openCredit();
    const confirmButton = [
      ...(fixture.nativeElement.querySelector('app-modal') as HTMLElement).querySelectorAll(
        'button',
      ),
    ].find((b) => b.textContent?.includes('Générer l’avoir')) as HTMLButtonElement;
    confirmButton.click();
    await fixture.whenStable();

    expect(service.byId(target.id)?.status).toBe('CANCELLED');
    expect(fixture.nativeElement.querySelector('app-modal')).toBeNull();
  });

  it('only offers a reminder on overdue invoices', async () => {
    const paid = await create('PAID');
    expect(paid.nativeElement.querySelector('tbody [title="Relancer"]')).toBeNull();

    const overdue = await create('OVERDUE');
    expect(overdue.nativeElement.querySelector('tbody [title="Relancer"]')).toBeTruthy();
  });

  it('renders row actions as icons carrying their label', async () => {
    const fixture = await create('OVERDUE');
    const actions = [...fixture.nativeElement.querySelectorAll('tbody app-icon-button [title]')];
    const labels = actions.map((action) => (action as HTMLElement).getAttribute('title'));

    // Seuls les gestes courants restent alignés dans la ligne.
    expect(labels).toContain('Voir');
    expect(labels).toContain('Paiement');
    expect(labels).toContain('Relancer');
    // L'icône ne porte aucun texte : le nom accessible vient de aria-label.
    expect((actions[0] as HTMLElement).textContent?.trim()).toBe('');
    expect((actions[0] as HTMLElement).getAttribute('aria-label')).toBe('Voir');
  });

  it('moves the secondary actions into the row overflow menu', async () => {
    const fixture = await create('OVERDUE');

    // Fermé, le menu ne laisse fuiter aucune de ses entrées.
    expect(fixture.nativeElement.querySelector('.action-menu')).toBeNull();

    const trigger = fixture.nativeElement.querySelector(
      'tbody app-action-menu button[aria-haspopup="menu"]',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const entries = [...fixture.nativeElement.querySelectorAll('tbody .action-menu-item')].map(
      (item) => (item as HTMLElement).textContent?.trim(),
    );
    expect(entries).toContain('Envoyer par email');
    expect(entries).toContain('Dupliquer');
  });

  it('translates the tabs and the columns', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Outstanding');
    expect(text).toContain('Overdue');
    expect(text).not.toContain('Reste dû');
  });
});
