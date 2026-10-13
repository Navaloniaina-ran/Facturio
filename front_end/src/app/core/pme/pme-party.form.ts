import {
  Customer,
  LegalIdentity,
  OperationNature,
  PartyKind,
  PostalAddress,
  Supplier,
  isValidFrenchVatNumber,
  isValidSiren,
  isValidSiret,
} from './pme.models';

/**
 * Brouillons de saisie d'un tiers, et leurs règles de validation.
 *
 * Les règles vivent ici plutôt que dans les composants : les fiches client et
 * fournisseur partagent la même identité légale, et une divergence entre les
 * deux écrans serait invisible jusqu'à ce qu'une facture parte avec un SIREN
 * mal formé.
 *
 * `companyId` est absent des brouillons : l'appartenance à une entreprise est
 * décidée par le magasin, jamais par le formulaire.
 */

/** Champs communs aux deux fiches. */
export interface PartyDraft {
  kind: PartyKind;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: PostalAddress;
  identity: LegalIdentity;
  paymentTermsDays: number;
  notes: string;
  active: boolean;
}

export type CustomerDraft = PartyDraft & Pick<Customer, 'deliveryAddress' | 'creditLimit'>;
export type SupplierDraft = PartyDraft & Pick<Supplier, 'iban' | 'defaultNature'>;

/** Plafond légal du délai de règlement entre professionnels, en jours. */
export const MAX_PAYMENT_TERMS_DAYS = 60;

function emptyAddress(): PostalAddress {
  return { street: '', postalCode: '', city: '', countryCode: 'FR' };
}

function emptyIdentity(): LegalIdentity {
  return {
    siren: '',
    siret: '',
    vatNumber: '',
    legalForm: null,
    rcsCity: '',
    shareCapital: 0,
    napCode: '',
  };
}

export function emptyCustomerDraft(paymentTermsDays = 30): CustomerDraft {
  return {
    kind: 'COMPANY',
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: emptyAddress(),
    identity: emptyIdentity(),
    paymentTermsDays,
    notes: '',
    active: true,
    deliveryAddress: null,
    creditLimit: 0,
  };
}

export function emptySupplierDraft(paymentTermsDays = 30): SupplierDraft {
  return {
    kind: 'COMPANY',
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: emptyAddress(),
    identity: emptyIdentity(),
    paymentTermsDays,
    notes: '',
    active: true,
    iban: '',
    defaultNature: 'GOODS',
  };
}

/** Copie profonde d'une fiche vers un brouillon éditable. */
export function customerToDraft(customer: Customer): CustomerDraft {
  return {
    kind: customer.kind,
    name: customer.name,
    contact: customer.contact,
    email: customer.email,
    phone: customer.phone,
    address: { ...customer.address },
    identity: { ...customer.identity },
    paymentTermsDays: customer.paymentTermsDays,
    notes: customer.notes,
    active: customer.active,
    deliveryAddress: customer.deliveryAddress ? { ...customer.deliveryAddress } : null,
    creditLimit: customer.creditLimit,
  };
}

export function supplierToDraft(supplier: Supplier): SupplierDraft {
  return {
    kind: supplier.kind,
    name: supplier.name,
    contact: supplier.contact,
    email: supplier.email,
    phone: supplier.phone,
    address: { ...supplier.address },
    identity: { ...supplier.identity },
    paymentTermsDays: supplier.paymentTermsDays,
    notes: supplier.notes,
    active: supplier.active,
    iban: supplier.iban,
    defaultNature: supplier.defaultNature,
  };
}

/**
 * Valide le tronc commun. Renvoie la clé de traduction du premier défaut
 * rencontré, ou `null` si la fiche est acceptable.
 *
 * Le SIREN n'est exigé que d'un tiers professionnel : un particulier n'en a
 * pas. Il est en revanche indispensable dès lors qu'on facture une entreprise,
 * puisqu'il est devenu une mention systématique de la facture.
 */
export function validateParty(draft: PartyDraft): string | null {
  if (!draft.name.trim()) {
    return 'pme.form.error.name';
  }

  if (draft.email.trim() && !draft.email.includes('@')) {
    return 'pme.form.error.email';
  }

  if (draft.paymentTermsDays < 0) {
    return 'pme.form.error.termsNegative';
  }

  if (draft.paymentTermsDays > MAX_PAYMENT_TERMS_DAYS) {
    return 'pme.form.error.termsTooLong';
  }

  if (draft.kind === 'INDIVIDUAL') {
    return null;
  }

  const siren = draft.identity.siren.replace(/\s/g, '');
  if (!siren) {
    return 'pme.form.error.sirenRequired';
  }
  if (!isValidSiren(siren)) {
    return 'pme.form.error.siren';
  }

  const siret = draft.identity.siret.replace(/\s/g, '');
  if (siret) {
    if (!isValidSiret(siret)) {
      return 'pme.form.error.siret';
    }
    // Les neuf premiers chiffres du SIRET sont le SIREN de l'entreprise :
    // une divergence signale une saisie mélangeant deux établissements.
    if (!siret.startsWith(siren)) {
      return 'pme.form.error.siretMismatch';
    }
  }

  const vatNumber = draft.identity.vatNumber.replace(/\s/g, '').toUpperCase();
  // Seuls les numéros français sont contrôlés : le format varie d'un État
  // membre à l'autre, et un faux négatif bloquerait une saisie valable.
  if (vatNumber.startsWith('FR') && !isValidFrenchVatNumber(vatNumber)) {
    return 'pme.form.error.vatNumber';
  }

  return null;
}

export function validateCustomer(draft: CustomerDraft): string | null {
  return validateParty(draft);
}

export function validateSupplier(draft: SupplierDraft): string | null {
  const common = validateParty(draft);
  if (common) {
    return common;
  }

  // L'IBAN n'est pas obligatoire, mais s'il est saisi il doit être plausible :
  // 2 lettres de pays, 2 chiffres de clé, puis 11 à 30 caractères.
  const iban = draft.iban.replace(/\s/g, '').toUpperCase();
  if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) {
    return 'pme.form.error.iban';
  }

  return null;
}

/** Natures d'opération proposées à la saisie. */
export const OPERATION_NATURES: OperationNature[] = ['GOODS', 'SERVICES', 'MIXED'];
