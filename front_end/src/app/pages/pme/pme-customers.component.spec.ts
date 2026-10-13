import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PmeStore } from '../../core/pme/pme-store.service';
import { PmeCustomersComponent } from './pme-customers.component';

describe('PmeCustomersComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [PmeCustomersComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
    TestBed.inject(AuthService).signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
    TestBed.inject(PmeStore).selectCompany('c-atelier');
  });

  async function create() {
    const fixture = TestBed.createComponent(PmeCustomersComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('lists only the active company customers', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Atelier Dupont');
    expect(text).toContain('Menuiserie Lavigne');
    expect(text).toContain('Paul Mercier');
    expect(text).not.toContain('Groupe Belland');
  });

  // Test bloquant : après bascule, aucune donnée de l'entreprise précédente
  // ne doit subsister dans le rendu.
  it('renders nothing from the previous company after switching', async () => {
    const fixture = await create();

    TestBed.inject(PmeStore).selectCompany('c-numeris');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Groupe Belland');
    expect(text).not.toContain('Menuiserie Lavigne');
    expect(text).not.toContain('Paul Mercier');
  });

  it('flags a customer whose delivery address differs from the billing one', async () => {
    const fixture = await create();

    // Menuiserie Lavigne est livrée sur un chantier : mention obligatoire.
    expect(fixture.nativeElement.textContent).toContain('Adresse de livraison distincte');
  });

  it('warns about the VAT on debits option of the active company', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).not.toContain('TVA sur les débits');

    // Numeris Conseil a exercé l'option.
    TestBed.inject(PmeStore).selectCompany('c-numeris');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('TVA sur les débits');
  });

  it('filters the list with the search field', async () => {
    const fixture = await create();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'Lavigne';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Menuiserie Lavigne');
    expect(text).not.toContain('Paul Mercier');
  });
});
