import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { CampaignService } from './campaign.service';
import { CampaignsComponent } from './campaigns.component';

describe('CampaignsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
      providers: [provideRouter([{ path: 'createur/factures', children: [] }])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(CampaignsComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('shows one card per campaign with its commercial chain', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(
      TestBed.inject(CampaignService).list().length,
    );
    expect(text).toContain('Nike Summer');
    expect(text).toContain('Proposition');
    expect(text).toContain('Paiement');
  });

  it('filters on active campaigns', async () => {
    const fixture = await create();
    // Le segment porte désormais son effectif à côté de son libellé.
    const button = [...fixture.nativeElement.querySelectorAll('app-filter-segments button')].find(
      (b) => (b as HTMLButtonElement).textContent?.trim().startsWith('Active'),
    ) as HTMLButtonElement | undefined;

    expect(button).toBeDefined();
    expect(button!.getAttribute('aria-pressed')).toBe('false');

    button!.click();
    await fixture.whenStable();

    expect(button!.getAttribute('aria-pressed')).toBe('true');

    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(
      TestBed.inject(CampaignService).active().length,
    );
  });

  it('generates an invoice from the campaign', async () => {
    const fixture = await create();
    const service = TestBed.inject(CampaignService);
    const before = service.list().find((c) => c.name === 'Nike Summer')!.invoices.length;

    const card = [...fixture.nativeElement.querySelectorAll('article')].find((article) =>
      (article as HTMLElement).textContent?.includes('Nike Summer'),
    ) as HTMLElement;
    const button = card.querySelector('[title="Générer la facture"]') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    const after = service.list().find((c) => c.name === 'Nike Summer')!.invoices.length;
    expect(after).toBe(before + 1);
    expect(fixture.nativeElement.textContent).toContain('générée sans ressaisie');
  });

  it('opens the creation form', async () => {
    const fixture = await create();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Nouvelle campagne'),
    ) as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nom de la campagne');
  });

  it('translates the chain steps and the action labels', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Quote');
    expect(text).toContain('Contract');
    expect(fixture.nativeElement.querySelector('[title="Generate the invoice"]')).toBeTruthy();
  });
});
