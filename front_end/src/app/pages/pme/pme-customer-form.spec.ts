import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PmeStore } from '../../core/pme/pme-store.service';
import { PmeCustomersComponent } from './pme-customers.component';

/** Saisie d'un champ repéré par son attribut `name`. */
function fill(fixture: ComponentFixture<PmeCustomersComponent>, name: string, value: string) {
  const input = fixture.nativeElement.querySelector(`[name="${name}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function click(fixture: ComponentFixture<PmeCustomersComponent>, label: string) {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find((item) =>
    (item as HTMLButtonElement).textContent?.trim().startsWith(label),
  ) as HTMLButtonElement | undefined;
  button?.click();
}

describe('PmeCustomersComponent — formulaire', () => {
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

  async function openForm(fixture: ComponentFixture<PmeCustomersComponent>) {
    click(fixture, 'Nouveau client');
    await fixture.whenStable();
  }

  it('opens the form with the company default payment terms', async () => {
    const fixture = await create();
    await openForm(fixture);

    const terms = fixture.nativeElement.querySelector('[name="partyTerms"]') as HTMLInputElement;
    // Atelier Dupont règle à 30 jours.
    expect(terms.value).toBe('30');
  });

  it('creates a customer attached to the active company', async () => {
    const fixture = await create();
    const store = TestBed.inject(PmeStore);
    const before = store.customers().length;

    await openForm(fixture);
    fill(fixture, 'partyName', 'Charpente Moderne');
    fill(fixture, 'partySiren', '123456789');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(store.customers().length).toBe(before + 1);
    const created = store.customers().find((item) => item.name === 'Charpente Moderne');
    expect(created?.companyId).toBe('c-atelier');
    expect(fixture.nativeElement.textContent).toContain('Client enregistré.');

    // La fiche ne doit pas apparaître chez l'autre entreprise.
    store.selectCompany('c-numeris');
    expect(store.customers().map((item) => item.name)).not.toContain('Charpente Moderne');
  });

  it('refuses a professional customer without a SIREN and keeps the form open', async () => {
    const fixture = await create();
    const before = TestBed.inject(PmeStore).customers().length;

    await openForm(fixture);
    fill(fixture, 'partyName', 'Sans SIREN');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Le SIREN est obligatoire pour un tiers professionnel.',
    );
    expect(TestBed.inject(PmeStore).customers().length).toBe(before);
    expect(fixture.nativeElement.querySelector('app-modal')).toBeTruthy();
  });

  it('refuses payment terms beyond the sixty-day legal cap', async () => {
    const fixture = await create();

    await openForm(fixture);
    fill(fixture, 'partyName', 'Délai excessif');
    fill(fixture, 'partySiren', '123456789');
    fill(fixture, 'partyTerms', '90');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('ne peut pas dépasser 60 jours');
  });

  it('hides the legal identity block for an individual', async () => {
    const fixture = await create();
    await openForm(fixture);

    expect(fixture.nativeElement.querySelector('[name="partySiren"]')).toBeTruthy();

    click(fixture, 'Particulier');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[name="partySiren"]')).toBeNull();
  });

  it('edits an existing customer without touching the other company', async () => {
    const fixture = await create();
    const store = TestBed.inject(PmeStore);

    click(fixture, 'Modifier');
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector('[name="partyName"]') as HTMLInputElement;
    expect(name.value).toBe('Menuiserie Lavigne');

    fill(fixture, 'partyName', 'Menuiserie Lavigne & Fils');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(store.customers().map((item) => item.name)).toContain('Menuiserie Lavigne & Fils');
    expect(store.customers().length).toBe(2);
  });

  it('drops the delivery address when the billing one is reused', async () => {
    const fixture = await create();
    const store = TestBed.inject(PmeStore);

    // Menuiserie Lavigne porte une adresse de livraison distincte.
    click(fixture, 'Modifier');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[name="deliveryStreet"]')).toBeTruthy();

    const sameAddress = fixture.nativeElement.querySelector(
      '[name="separateDelivery"]',
    ) as HTMLInputElement;
    sameAddress.click();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(store.customerById('cl-1')?.deliveryAddress).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Adresse de livraison distincte');
  });
});
