import {
  emptyCustomerDraft,
  emptySupplierDraft,
  validateCustomer,
  validateSupplier,
} from './pme-party.form';

describe('validation des fiches tiers', () => {
  function validCompany() {
    const draft = emptyCustomerDraft();
    draft.name = 'Menuiserie Lavigne';
    draft.identity.siren = '452789123';
    return draft;
  }

  it('accepts a professional customer with a valid SIREN', () => {
    expect(validateCustomer(validCompany())).toBeNull();
  });

  it('requires a name', () => {
    const draft = validCompany();
    draft.name = '   ';
    expect(validateCustomer(draft)).toBe('pme.form.error.name');
  });

  it('requires a SIREN from a professional, but not from an individual', () => {
    const company = emptyCustomerDraft();
    company.name = 'Société sans SIREN';
    expect(validateCustomer(company)).toBe('pme.form.error.sirenRequired');

    const individual = emptyCustomerDraft();
    individual.name = 'Paul Mercier';
    individual.kind = 'INDIVIDUAL';
    expect(validateCustomer(individual)).toBeNull();
  });

  it('rejects a SIREN that is not nine digits', () => {
    const draft = validCompany();
    draft.identity.siren = '4527891';
    expect(validateCustomer(draft)).toBe('pme.form.error.siren');
  });

  it('accepts a SIREN typed with spaces', () => {
    const draft = validCompany();
    draft.identity.siren = '452 789 123';
    expect(validateCustomer(draft)).toBeNull();
  });

  it('rejects a SIRET that does not start with the SIREN', () => {
    const draft = validCompany();
    draft.identity.siret = '99999999900015';
    expect(validateCustomer(draft)).toBe('pme.form.error.siretMismatch');
  });

  it('accepts a SIRET built on the SIREN', () => {
    const draft = validCompany();
    draft.identity.siret = '45278912300015';
    expect(validateCustomer(draft)).toBeNull();
  });

  it('checks French VAT numbers only', () => {
    const draft = validCompany();

    draft.identity.vatNumber = 'FR00';
    expect(validateCustomer(draft)).toBe('pme.form.error.vatNumber');

    draft.identity.vatNumber = 'FR89452789123';
    expect(validateCustomer(draft)).toBeNull();

    // Un numéro étranger n'est pas contrôlé : les formats varient.
    draft.identity.vatNumber = 'BE0123456789';
    expect(validateCustomer(draft)).toBeNull();
  });

  it('enforces the sixty-day legal cap on payment terms', () => {
    const draft = validCompany();

    draft.paymentTermsDays = 60;
    expect(validateCustomer(draft)).toBeNull();

    draft.paymentTermsDays = 90;
    expect(validateCustomer(draft)).toBe('pme.form.error.termsTooLong');

    draft.paymentTermsDays = -1;
    expect(validateCustomer(draft)).toBe('pme.form.error.termsNegative');
  });

  it('rejects a malformed email but tolerates an empty one', () => {
    const draft = validCompany();

    draft.email = 'pas-un-email';
    expect(validateCustomer(draft)).toBe('pme.form.error.email');

    draft.email = '';
    expect(validateCustomer(draft)).toBeNull();
  });

  it('checks the supplier IBAN when one is provided', () => {
    const draft = emptySupplierDraft();
    draft.name = 'Bois du Rhône';
    draft.identity.siren = '512345987';

    expect(validateSupplier(draft)).toBeNull();

    draft.iban = 'FR76 1234 5678 9012 3456 7890 189';
    expect(validateSupplier(draft)).toBeNull();

    draft.iban = 'XX';
    expect(validateSupplier(draft)).toBe('pme.form.error.iban');
  });
});
