/**
 * Modèles métier de l'espace PME (workspaceType = BUSINESS).
 *
 * Une PME ne facture pas comme un créateur : elle porte une identité légale
 * complète (SIREN, forme juridique, capital, RCS), tient à la fois un fichier
 * clients et un fichier fournisseurs, et doit inscrire sur ses factures des
 * mentions que le Code de commerce et le CGI imposent.
 *
 * Chaque donnée appartient à une entreprise et une seule : c'est le champ
 * `companyId` qui porte cette appartenance, et le magasin qui la fait
 * respecter (voir pme-store.service.ts).
 */

/** Formes juridiques les plus courantes en PME française. */
export type LegalForm = 'EI' | 'EURL' | 'SARL' | 'SAS' | 'SASU' | 'SA' | 'SNC' | 'SCI';

/**
 * Régime de TVA de l'entreprise émettrice.
 * `FRANCHISE_BASE` déclenche la mention de l'article 293 B du CGI et interdit
 * toute TVA sur les documents émis.
 */
export type VatRegime = 'REEL_NORMAL' | 'REEL_SIMPLIFIE' | 'FRANCHISE_BASE';

/**
 * Nature de l'opération facturée. Mention obligatoire à compter du
 * 1er septembre 2026 pour les grandes entreprises et les ETI, du
 * 1er septembre 2027 pour les PME.
 */
export type OperationNature = 'GOODS' | 'SERVICES' | 'MIXED';

/** Un tiers est soit une entreprise, soit un particulier. */
export type PartyKind = 'COMPANY' | 'INDIVIDUAL';

/**
 * Taux de TVA applicables en France.
 * 20 % normal, 10 % intermédiaire, 5,5 % réduit, 2,1 % particulier.
 * Le 0 couvre l'exonération et l'autoliquidation.
 */
export const FRENCH_VAT_RATES = [20, 10, 5.5, 2.1, 0] as const;

/**
 * Seuils de franchise en base pour 2026, par nature d'activité.
 * Le seuil unique à 25 000 € annoncé puis abandonné n'est pas retenu.
 */
export const FRANCHISE_THRESHOLDS_2026 = {
  /** Ventes de marchandises et hébergement. */
  goods: { base: 85_000, increased: 93_500 },
  /** Prestations de services. */
  services: { base: 37_500, increased: 41_250 },
  /** Avocats, auteurs et artistes-interprètes. */
  liberal: { base: 50_000, increased: 55_000 },
} as const;

/** Coordonnées postales, séparées pour pouvoir être comparées champ à champ. */
export interface PostalAddress {
  street: string;
  postalCode: string;
  city: string;
  /** Code pays ISO 3166-1 alpha-2, requis par la facture électronique. */
  countryCode: string;
}

/**
 * Identité légale commune à l'émetteur et à ses tiers professionnels.
 * Le SIREN est devenu une mention systématique sur les factures : il est
 * donc porté ici plutôt que déduit du SIRET.
 */
export interface LegalIdentity {
  /** 9 chiffres. Vide pour un particulier. */
  siren: string;
  /** 14 chiffres : SIREN + NIC de l'établissement. */
  siret: string;
  /** Numéro de TVA intracommunautaire, ex. FR12345678901. */
  vatNumber: string;
  legalForm: LegalForm | null;
  /** Ville du greffe d'immatriculation, portée par la mention RCS. */
  rcsCity: string;
  /** Capital social en euros. */
  shareCapital: number;
  /** Code APE/NAF, ex. 6201Z. */
  napCode: string;
}

/**
 * L'entreprise émettrice. Une même personne peut en administrer plusieurs :
 * c'est l'entreprise active qui détermine ce que l'interface donne à voir.
 */
export interface Company {
  id: string;
  name: string;
  identity: LegalIdentity;
  address: PostalAddress;
  email: string;
  phone: string;
  vatRegime: VatRegime;
  /**
   * Option pour le paiement de la TVA sur les débits. Mention obligatoire
   * sur la facture lorsqu'elle est exercée.
   */
  vatOnDebits: boolean;
  iban: string;
  bic: string;
  /** Préfixe de la série de numérotation, propre à l'entreprise. */
  invoicePrefix: string;
  /** Délai de règlement par défaut, en jours. Plafond légal : 60 jours. */
  defaultPaymentTermsDays: number;
  logo: string | null;
}

/** Champs communs à un client et à un fournisseur. */
interface PartyBase {
  id: string;
  /** Entreprise propriétaire de la fiche. Jamais partagée entre PME. */
  companyId: string;
  kind: PartyKind;
  name: string;
  /** Nom de la personne à contacter. */
  contact: string;
  email: string;
  phone: string;
  address: PostalAddress;
  identity: LegalIdentity;
  paymentTermsDays: number;
  notes: string;
  active: boolean;
}

/**
 * Client de la PME. L'adresse de livraison n'est renseignée que si elle
 * diffère de l'adresse de facturation : dans ce cas elle devient une mention
 * obligatoire de la facture.
 */
export interface Customer extends PartyBase {
  deliveryAddress: PostalAddress | null;
  /** Encours autorisé, en euros. 0 = pas de plafond suivi. */
  creditLimit: number;
}

/** Fournisseur de la PME, pour les factures reçues. */
export interface Supplier extends PartyBase {
  iban: string;
  /** Nature habituelle des achats auprès de ce fournisseur. */
  defaultNature: OperationNature;
}

/** Un tiers, quel que soit son rôle : sert aux écrans partagés. */
export type Party = Customer | Supplier;

/** Vrai si l'adresse de livraison doit figurer sur la facture. */
export function deliveryAddressDiffers(customer: Customer): boolean {
  const delivery = customer.deliveryAddress;
  if (!delivery) {
    return false;
  }

  const billing = customer.address;
  return (
    delivery.street !== billing.street ||
    delivery.postalCode !== billing.postalCode ||
    delivery.city !== billing.city ||
    delivery.countryCode !== billing.countryCode
  );
}

/** Le SIREN tient en 9 chiffres, sans espaces. */
export function isValidSiren(siren: string): boolean {
  return /^\d{9}$/.test(siren.replace(/\s/g, ''));
}

/** Le SIRET tient en 14 chiffres et commence par le SIREN. */
export function isValidSiret(siret: string): boolean {
  return /^\d{14}$/.test(siret.replace(/\s/g, ''));
}

/**
 * Le numéro de TVA français vaut FR + clé à deux caractères + SIREN.
 * Les numéros étrangers ne sont pas validés ici : leur format varie d'un
 * État membre à l'autre.
 */
export function isValidFrenchVatNumber(value: string): boolean {
  return /^FR[0-9A-Z]{2}\d{9}$/.test(value.replace(/\s/g, '').toUpperCase());
}
