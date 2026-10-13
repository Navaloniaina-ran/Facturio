import { TestBed } from '@angular/core/testing';
import { PmeStore } from './pme-store.service';

describe('PmeStore', () => {
  let store: PmeStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PmeStore);
    store.selectCompany('c-atelier');
  });

  it('starts on a company and exposes both of them', () => {
    expect(store.activeCompany()?.name).toBe('Atelier Dupont');
    expect(store.companies().length).toBe(2);
    expect(store.hasMultipleCompanies()).toBe(true);
  });

  // Le test qui compte : après bascule, plus rien de l'entreprise précédente.
  it('never leaks one company data into another', () => {
    const atelierCustomers = store.customers().map((item) => item.name);
    const atelierSuppliers = store.suppliers().map((item) => item.name);

    expect(atelierCustomers).toContain('Menuiserie Lavigne');
    expect(atelierSuppliers).toContain('Bois du Rhône');

    store.selectCompany('c-numeris');

    const numerisCustomers = store.customers().map((item) => item.name);
    const numerisSuppliers = store.suppliers().map((item) => item.name);

    expect(numerisCustomers).toContain('Groupe Belland');
    expect(numerisSuppliers).toContain('Hébergeur Cloud FR');

    for (const name of atelierCustomers) {
      expect(numerisCustomers).not.toContain(name);
    }
    for (const name of atelierSuppliers) {
      expect(numerisSuppliers).not.toContain(name);
    }
  });

  it('refuses to read a record owned by another company', () => {
    expect(store.customerById('cl-1')).not.toBeNull();
    // cl-3 appartient à Numeris Conseil.
    expect(store.customerById('cl-3')).toBeNull();

    store.selectCompany('c-numeris');

    expect(store.customerById('cl-3')).not.toBeNull();
    expect(store.customerById('cl-1')).toBeNull();
  });

  it('refuses to update or delete across the company boundary', () => {
    expect(store.updateCustomer('cl-3', { name: 'Détourné' })).toBe(false);
    expect(store.removeCustomer('cl-3')).toBe(false);

    store.selectCompany('c-numeris');
    expect(store.customers().find((item) => item.id === 'cl-3')?.name).toBe('Groupe Belland');
  });

  it('stamps a new record with the active company', () => {
    const created = store.addCustomer({
      kind: 'COMPANY',
      name: 'Nouveau Client',
      contact: 'Alex Martin',
      email: 'alex@nouveau.example',
      phone: '',
      address: { street: '', postalCode: '', city: '', countryCode: 'FR' },
      identity: {
        siren: '',
        siret: '',
        vatNumber: '',
        legalForm: null,
        rcsCity: '',
        shareCapital: 0,
        napCode: '',
      },
      deliveryAddress: null,
      paymentTermsDays: 30,
      creditLimit: 0,
      notes: '',
      active: true,
    });

    expect(created?.companyId).toBe('c-atelier');
    expect(store.customers().map((item) => item.name)).toContain('Nouveau Client');

    store.selectCompany('c-numeris');
    expect(store.customers().map((item) => item.name)).not.toContain('Nouveau Client');
  });

  it('falls back to the first company when the stored one is unknown', () => {
    store.selectCompany('entreprise-inexistante');
    expect(store.activeCompany()?.id).toBe('c-atelier');
  });
});
