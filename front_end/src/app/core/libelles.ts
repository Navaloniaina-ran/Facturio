import { StatutCampagne, StatutFacture, StatutProposition, StatutRelance, TypeLivrable, MethodePaiement, WorkspaceType } from './modeles';

/**
 * Dictionnaire de libellés indexé par workspace_type.
 * Exigence du cahier des charges : aucun libellé métier codé en dur
 * dans les composants. Seul CREATOR est livré dans ce lot.
 */
const DICTIONNAIRE: Record<WorkspaceType, Record<string, string>> = {
  CREATOR: {
    client: 'Marque',
    clients: 'Marques',
    project: 'Campagne',
    projects: 'Campagnes',
    quote: 'Proposition',
    quotes: 'Propositions',
    item: 'Livrable',
    items: 'Livrables',
    invoice: 'Facture',
    invoices: 'Factures',
    reminder: 'Relance',
    reminders: 'Relances',
  },
  BUSINESS: {
    client: 'Client',
    clients: 'Clients',
    project: 'Projet',
    projects: 'Projets',
    quote: 'Devis',
    quotes: 'Devis',
    item: 'Prestation',
    items: 'Prestations',
    invoice: 'Facture',
    invoices: 'Factures',
    reminder: 'Relance',
    reminders: 'Relances',
  },
};

export function libelle(cle: string, type: WorkspaceType = 'CREATOR'): string {
  return DICTIONNAIRE[type][cle] ?? cle;
}

export const LIBELLES_LIVRABLE: Record<TypeLivrable, string> = {
  REEL: 'Reel',
  STORY: 'Story',
  POST: 'Publication',
  VIDEO: 'Vidéo',
  UGC: 'UGC',
  EVENEMENT: 'Événement',
};

export const LIBELLES_STATUT_CAMPAGNE: Record<StatutCampagne, string> = {
  BROUILLON: 'Brouillon',
  EN_ATTENTE: 'En attente',
  ACTIVE: 'Active',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const LIBELLES_STATUT_PROPOSITION: Record<StatutProposition, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
  EXPIREE: 'Expirée',
  FACTUREE: 'Facturée',
};

export const LIBELLES_STATUT_FACTURE: Record<StatutFacture, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  PAYEE: 'Payée',
  EN_RETARD: 'En retard',
  ANNULEE: 'Annulée',
};

export const LIBELLES_STATUT_RELANCE: Record<StatutRelance, string> = {
  PROGRAMMEE: 'Programmée',
  A_VALIDER: 'À valider',
  ENVOYEE: 'Envoyée',
  ANNULEE: 'Annulée',
  ECHOUEE: 'Échouée',
};

/** Tous les statuts, à plat, pour l'affichage d'un badge générique. */
export const LIBELLES_STATUT: Record<string, string> = {
  ...LIBELLES_STATUT_CAMPAGNE,
  ...LIBELLES_STATUT_PROPOSITION,
  ...LIBELLES_STATUT_FACTURE,
  ...LIBELLES_STATUT_RELANCE,
};

export type TonStatut = 'neutre' | 'info' | 'succes' | 'attention' | 'danger';

const TONS: Record<string, TonStatut> = {
  BROUILLON: 'neutre',
  ANNULEE: 'neutre',
  EXPIREE: 'neutre',
  ENVOYEE: 'info',
  EN_ATTENTE: 'info',
  PROGRAMMEE: 'info',
  ACTIVE: 'info',
  A_VALIDER: 'attention',
  PARTIELLEMENT_PAYEE: 'attention',
  ACCEPTEE: 'succes',
  PAYEE: 'succes',
  TERMINEE: 'succes',
  FACTUREE: 'succes',
  EN_RETARD: 'danger',
  REFUSEE: 'danger',
  ECHOUEE: 'danger',
};

export function libelleStatut(code: string): string {
  return LIBELLES_STATUT[code] ?? code;
}

export function tonStatut(code: string): TonStatut {
  return TONS[code] ?? 'neutre';
}

export const LIBELLES_METHODE: Record<MethodePaiement, string> = {
  VIREMENT: 'Virement',
  MOBILE_MONEY: 'Mobile money',
  CARTE: 'Carte',
  ESPECES: 'Espèces',
  PAYPAL: 'PayPal',
};
