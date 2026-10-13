/**
 * Modèles métier de l'espace Créateur & Influenceur (FRONT 1).
 * Le socle technique reste commun (workspaceType = CREATOR) ;
 * seuls les libellés changent, voir core/i18n.
 */

export type WorkspaceType = 'CREATOR' | 'BUSINESS';

export type DeliverableType = 'REEL' | 'STORY' | 'POST' | 'VIDEO' | 'UGC' | 'EVENT';

export type CampaignStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REFUSED' | 'EXPIRED' | 'INVOICED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod = 'TRANSFER' | 'MOBILE_MONEY' | 'CARD' | 'CASH' | 'PAYPAL';

export type ReminderStatus = 'SCHEDULED' | 'AWAITING' | 'SENT' | 'CANCELLED' | 'FAILED';

/** Une remise s'exprime en pourcentage ou en montant fixe. */
export type DiscountType = 'PERCENT' | 'AMOUNT';

export interface Discount {
  type: DiscountType;
  value: number;
}

/**
 * Taxe additionnelle d'un document : retenue à la source, taxe locale,
 * contribution sectorielle… Elle s'applique sur la base hors taxes.
 * Un taux négatif exprime une retenue.
 */
export interface DocumentTax {
  id: string;
  label: string;
  rate: number;
}

/** Ligne de prestation : « livrable » dans le vocabulaire créateur. */
export interface Line {
  id: string;
  description: string;
  deliverableType: DeliverableType;
  quantity: number;
  unitPrice: number;
  /** Remise de ligne, en pourcentage ou en montant. */
  discountType: DiscountType;
  discountValue: number;
  vatRate: number;
}

/** client → « Marque / Annonceur ». */
export interface Brand {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  /** Code pays ISO 3166-1 alpha-2, requis par la facture électronique. */
  countryCode: string;
  paymentTermsDays: number;
  notes: string;
  /** Suspend les relances automatiques pour cette marque. */
  remindersPaused: boolean;
}

/** project (nature = CAMPAIGN) → « Campagne ». */
export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  deliverables: Line[];
  contractName: string | null;
  quoteAccepted: boolean;
  contractSigned: boolean;
}

/** quote → « Proposition de collaboration ». */
export interface Quote {
  id: string;
  number: string;
  brandId: string;
  campaignId: string | null;
  date: string;
  expiryDate: string;
  status: QuoteStatus;
  lines: Line[];
  /** Remise globale appliquée après les remises de ligne. */
  globalDiscount: Discount;
  /** La TVA se décide document par document, et peut être retirée. */
  vatApplicable: boolean;
  /** Taxes additionnelles propres au document. */
  extraTaxes: DocumentTax[];
  terms: string;
  /** Traçabilité proposition ↔ facture. */
  invoiceId: string | null;
}

export type InvoiceKind = 'INVOICE' | 'CREDIT_NOTE';

export interface Invoice {
  id: string;
  /** Facture ou avoir : séries de numérotation distinctes. */
  kind: InvoiceKind;
  number: string;
  brandId: string;
  campaignId: string | null;
  quoteId: string | null;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: Line[];
  globalDiscount: Discount;
  vatApplicable: boolean;
  extraTaxes: DocumentTax[];
  /** Acompte convenu, en pourcentage du total TTC. */
  depositPercent: number;
  terms: string;
  /** Renseigné dès le premier envoi par email. */
  sentAt: string | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  note: string;
}

/** reminderRules : une étape du scénario de relance. */
export interface ReminderStep {
  id: string;
  /** Clé de traduction du libellé de l'étape. */
  labelKey: string;
  /** Décalage en jours par rapport à l'échéance (négatif = avant). */
  offsetDays: number;
  channel: 'EMAIL';
  /** Clé de traduction du modèle de message. */
  templateKey: string;
  active: boolean;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  stepId: string;
  scheduledDate: string;
  sentDate: string | null;
  status: ReminderStatus;
  content: string;
}

export type PlanCode = 'FREE' | 'PRO' | 'STUDIO';

export interface Creator {
  id: string;
  name: string;
  handle: string;
  email: string;
  subProfile: 'INFLUENCER' | 'CREATOR' | 'FREELANCE';
  platforms: string[];
  niche: string;
  country: string;
  currency: string;
  vatRegistered: boolean;
  plan: PlanCode;
}

/** Ce que l'on ne règle qu'une seule fois : module Paramètres. */
export interface Settings {
  /** Nom affiché sur les documents. */
  businessName: string;
  address: string;
  /** Code pays ISO 3166-1 alpha-2 de l'émetteur. */
  countryCode: string;
  taxId: string;
  bankDetails: string;
  /** Logo en data URI, affiché sur la facture. */
  logo: string | null;
  accentColor: string;
  invoicePrefix: string;
  quotePrefix: string;
  creditPrefix: string;
  defaultPaymentTermsDays: number;
  defaultTerms: string;
  legalMentions: string;
  /** Mention de pénalités de retard, obligatoire entre professionnels. */
  latePaymentMention: string;
  /** Mention affichée lorsque la TVA n'est pas applicable. */
  vatExemptionMention: string;
  invoiceFooter: string;
  currency: string;
}

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'UNPAID' | 'SUSPENDED' | 'CANCELLED';

export interface Subscription {
  plan: PlanCode;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  startDate: string;
  trialEndDate: string | null;
  nextBillingDate: string;
  /** Annulation demandée : l'accès reste ouvert jusqu'à l'échéance. */
  cancelAtPeriodEnd: boolean;
}

/** Facture d'abonnement émise par la plateforme. */
export interface PlatformInvoice {
  id: string;
  number: string;
  date: string;
  plan: PlanCode;
  cycle: BillingCycle;
  amount: number;
  status: 'PAID' | 'UNPAID';
}

export type CollaborationType = 'SPONSORED' | 'AMBASSADOR' | 'UGC' | 'EVENT' | 'AFFILIATE';

export type CollaborationStage =
  'PROSPECT' | 'NEGOTIATION' | 'CONTRACT' | 'IN_PROGRESS' | 'DONE' | 'LOST';

/** Suivi amont d'une collaboration, avant qu'elle devienne une campagne. */
export interface Collaboration {
  id: string;
  brandId: string;
  title: string;
  type: CollaborationType;
  stage: CollaborationStage;
  estimatedAmount: number;
  contactDate: string;
  nextStepDate: string | null;
  nextStepNote: string;
  notes: string;
  campaignId: string | null;
  contractName: string | null;
}

/** Trace d'un envoi par email (facture ou proposition). */
export interface EmailLog {
  id: string;
  documentType: 'INVOICE' | 'QUOTE';
  documentId: string;
  documentNumber: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  /** L'email rappelle explicitement le reste à payer. */
  withOutstanding: boolean;
}

export type ActivityType =
  | 'QUOTE'
  | 'INVOICE'
  | 'PAYMENT'
  | 'REMINDER'
  | 'BRAND'
  | 'CAMPAIGN'
  | 'COLLABORATION'
  | 'SUBSCRIPTION'
  | 'EMAIL';

/** Les paramètres sont conservés brut : la phrase est traduite à l'affichage. */
export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  messageKey: string;
  params: Record<string, string | number>;
}

/** Résultat d'une action métier : le message reste une clé de traduction. */
export interface ActionResult<T = void> {
  ok: boolean;
  value?: T;
  errorKey?: string;
  params?: Record<string, string | number>;
}
