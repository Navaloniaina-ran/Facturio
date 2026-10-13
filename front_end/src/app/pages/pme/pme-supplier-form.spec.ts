import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PmeStore } from '../../core/pme/pme-store.service';
import { PmeSuppliersComponent } from './pme-suppliers.component';

function fill(fixture: ComponentFixture<PmeSuppliersComponent>, name: string, value: string) {
  const input = fixture.nativeElement.querySelector(`[name="${name}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function click(fixture: ComponentFixture<PmeSuppliersComponent>, label: string) {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find((item) =>
    (item as HTMLButtonElement).textContent?.trim().startsWith(label),
  ) as HTMLButtonElement | undefined;
  button?.click();
}

describe('PmeSuppliersComponent — formulaire', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [PmeSuppliersComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
    TestBed.inject(AuthService).signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
    TestBed.inject(PmeStore).selectCompany('c-atelier');
  });

  async function create() {
    const fixture = TestBed.createComponent(PmeSuppliersComponent);
    await fixture.whenStable();
    return fixture;
  }

  async function openForm(fixture: ComponentFixture<PmeSuppliersComponent>) {
    click(fixture, 'Nouveau fournisseur');
    await fixture.whenStable();
  }

  it('lists only the active company suppliers', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Bois du Rhône');
    expect(text).not.toContain('Hébergeur Cloud FR');
  });

  it('creates a supplier attached to the active company', async () => {
    const fixture = await create();
    const store = TestBed.inject(PmeStore);

    await openForm(fixture);
    fill(fixture, 'partyName', 'Quincaillerie Centrale');
    fill(fixture, 'partySiren', '987654321');
    fill(fixture, 'supplierIban', 'FR76 3000 4000 0312 3456 7890 143');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const created = store.suppliers().find((item) => item.name === 'Quincaillerie Centrale');
    expect(created?.companyId).toBe('c-atelier');
    expect(fixture.nativeElement.textContent).toContain('Fournisseur enregistré.');

    store.selectCompany('c-numeris');
    expect(store.suppliers().map((item) => item.name)).not.toContain('Quincaillerie Centrale');
  });

  it('refuses a malformed IBAN', async () => {
    const fixture = await create();
    const before = TestBed.inject(PmeStore).suppliers().length;

    await openForm(fixture);
    fill(fixture, 'partyName', 'IBAN douteux');
    fill(fixture, 'partySiren', '987654321');
    fill(fixture, 'supplierIban', 'XX');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('IBAN invalide.');
    expect(TestBed.inject(PmeStore).suppliers().length).toBe(before);
  });

  it('rejects a SIRET that does not match the SIREN', async () => {
    const fixture = await create();

    await openForm(fixture);
    fill(fixture, 'partyName', 'Établissement incohérent');
    fill(fixture, 'partySiren', '987654321');
    fill(fixture, 'partySiret', '11111111100015');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('doit commencer par le SIREN');
  });

  it('edits an existing supplier', async () => {
    const fixture = await create();
    const store = TestBed.inject(PmeStore);

    click(fixture, 'Modifier');
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector('[name="partyName"]') as HTMLInputElement;
    expect(name.value).toBe('Bois du Rhône');

    fill(fixture, 'partyName', 'Bois du Rhône SAS');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(store.suppliers().map((item) => item.name)).toContain('Bois du Rhône SAS');
    expect(store.suppliers().length).toBe(1);
  });
});
