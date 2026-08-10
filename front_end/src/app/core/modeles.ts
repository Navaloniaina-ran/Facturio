/**
 * Modèles métier de l'espace Créateur & Influenceur (FRONT 1).
 * Le socle technique reste commun (workspace_type = CREATOR),
 * seuls les libellés changent (voir core/libelles.ts).
 */

export type WorkspaceType = 'CREATOR' | 'BUSINESS';

export type TypeLivrable = 'REEL' | 'STORY' | 'POST' | 'VIDEO' | 'UGC' | 'EVENEMENT';

export type StatutCampagne = 'BROUILLON' | 'EN_ATTENTE' | 'ACTIVE' | 'TERMINEE' | 'ANNULEE';

export type StatutProposition =
  | 'BROUILLON'
  | 'ENVOYEE'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'EXPIREE'
  | 'FACTUREE';

export type StatutFacture =
  | 'BROUILLON'
  | 'ENVOYEE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'EN_RETARD'
  | 'ANNULEE';

export type MethodePaiement = 'VIREMENT' | 'MOBILE_MONEY' | 'CARTE' | 'ESPECES' | 'PAYPAL';

export type StatutRelance = 'PROGRAMMEE' | 'A_VALIDER' | 'ENVOYEE' | 'ANNULEE' | 'ECHOUEE';

/** Ligne de prestation : « livrable » côté créateur. */
export interface Ligne {
  id: string;
  description: string;
  typeLivrable: TypeLivrable;
  quantite: number;
  prixUnitaire: number;
  /** Remise de ligne, en pourcentage. */
  remisePourcent: number;
  tauxTva: number;
}

/** client → « Marque / Annonceur ». */
export interface Marque {
  id: string;
  nom: string;
  contact: string;
  email: string;
  telephone: string;
  adresse: string;
  conditionsPaiementJours: number;
  tauxTvaDefaut: number;
  notes: string;
  /** Suspend les relances automatiques pour cette marque. */
  relancesSuspendues: boolean;
}

/** project (nature = CAMPAIGN) → « Campagne ». */
export interface Campagne {
  id: string;
  marqueId: string;
  nom: string;
  debut: string;
  fin: string;
  statut: StatutCampagne;
  livrables: Ligne[];
  contratNom: string | null;
  propositionAcceptee: boolean;
  contratSigne: boolean;
}

/** quote → « Proposition de collaboration ». */
export interface Proposition {
  id: string;
  numero: string;
  marqueId: string;
  campagneId: string | null;
  date: string;
  dateExpiration: string;
  statut: StatutProposition;
  lignes: Ligne[];
  conditions: string;
  /** Traçabilité proposition ↔ facture. */
  factureId: string | null;
}

export interface Facture {
  id: string;
  numero: string;
  marqueId: string;
  campagneId: string | null;
  propositionId: string | null;
  dateEmission: string;
  dateEcheance: string;
  statut: StatutFacture;
  lignes: Ligne[];
  /** Acompte déjà convenu, en pourcentage du TTC. */
  acomptePourcent: number;
  conditions: string;
}

export interface Paiement {
  id: string;
  factureId: string;
  montant: number;
  date: string;
  methode: MethodePaiement;
  reference: string;
  note: string;
}

/** reminder_rules : une étape du scénario de relance. */
export interface EtapeRelance {
  id: string;
  libelle: string;
  /** Décalage en jours par rapport à l'échéance (négatif = avant). */
  decalageJours: number;
  canal: 'EMAIL';
  modele: string;
  active: boolean;
}

export interface Relance {
  id: string;
  factureId: string;
  etapeId: string;
  datePlanifiee: string;
  dateEnvoi: string | null;
  statut: StatutRelance;
  contenu: string;
}

export interface Createur {
  id: string;
  nom: string;
  pseudo: string;
  email: string;
  sousProfil: 'INFLUENCEUR' | 'CREATEUR' | 'FREELANCE';
  plateformes: string[];
  thematique: string;
  pays: string;
  devise: string;
  assujettiTva: boolean;
  logo: string | null;
  coordonneesBancaires: string | null;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
}

export interface Activite {
  id: string;
  date: string;
  libelle: string;
  type: 'PROPOSITION' | 'FACTURE' | 'PAIEMENT' | 'RELANCE' | 'MARQUE' | 'CAMPAGNE';
}
