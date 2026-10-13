/**
 * Contrats d'échange avec l'API Spring Boot, décrits tels que le backend les
 * publie. Les modèles du front (`core/models`) restent indépendants : la
 * conversion se fait dans `creator.mappers`, en un seul endroit.
 */

import { Discount, DocumentTax, Line, WorkspaceType } from '../models';

export interface SessionDto {
  name: string;
  email: string;
  workspaceType: WorkspaceType;
  memberRole?: string;
  platformRole?: string;
  authorities?: string[];
  accessToken?: string;
  newAccount: boolean;
}

export interface BrandDto {
  id: string;
  name: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  countryCode: string | null;
  paymentTermsDays: number;
  notes: string | null;
  remindersPaused: boolean;
}

export interface BrandRequestDto {
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  countryCode: string;
  paymentTermsDays: number;
  notes: string;
}

export interface CampaignDto {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  /** Livrables stockés en jsonb : le front y range ses lignes telles quelles. */
  deliverables: Line[] | null;
  contractUrl: string | null;
  contractSigned: boolean;
}

export interface CampaignRequestDto {
  brandId: string;
  name: string;
  startDate: string;
  endDate: string;
  deliverables: Line[];
}

export interface CollaborationDto {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  type: string;
  stage: string;
  estimatedAmount: number;
  contactDate: string;
  nextStepDate: string | null;
  nextStepNote: string | null;
  notes: string | null;
  campaignId: string | null;
  contractUrl: string | null;
  actionDue: boolean;
}

export interface CollaborationRequestDto {
  brandId: string;
  title: string;
  type: string;
  stage: string;
  estimatedAmount: number;
  contactDate: string;
  nextStepDate: string | null;
  nextStepNote: string;
  notes: string;
}

/** Transformation d'une collaboration en campagne : la marque vient du backend. */
export interface CollaborationCampaignRequestDto {
  name: string;
  startDate: string;
  endDate: string;
  deliverables: Line[];
}

export interface CreatorProfileDto {
  id: string;
  name: string;
  handle: string | null;
  email: string;
  subProfile: string;
  platforms: string[] | null;
  niche: string | null;
  countryCode: string;
  currency: string;
  vatRegistered: boolean;
  plan: string;
}

export interface SettingsDto {
  businessName: string;
  address: string | null;
  countryCode: string;
  taxId: string | null;
  bankDetails: string | null;
  logo: string | null;
  accentColor: string | null;
  invoicePrefix: string;
  quotePrefix: string;
  creditPrefix: string;
  defaultPaymentTermsDays: number;
  defaultTerms: string | null;
  legalMentions: string | null;
  latePaymentMention: string | null;
  vatExemptionMention: string | null;
  invoiceFooter: string | null;
  currency: string;
}

export interface SubscriptionDto {
  plan: string;
  status: string;
  cycle: string;
  startDate: string;
  trialEndDate: string | null;
  nextBillingDate: string;
  cancelAtPeriodEnd: boolean;
}

export interface PlatformInvoiceDto {
  id: string;
  number: string;
  date: string;
  plan: string;
  cycle: string;
  amount: number;
  status: string;
}

export interface BillingDocumentDto {
  id: string;
  kind: 'QUOTE' | 'INVOICE' | 'CREDIT_NOTE';
  number: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  projectId: string | null;
  sourceDocumentId: string | null;
  issueDate: string;
  dueDate: string | null;
  validUntil: string | null;
  status: string;
  lines: Array<{
    id: string;
    description: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    discountType: 'PERCENT' | 'AMOUNT';
    discountValue: number;
    vatRate: number;
  }>;
  globalDiscount: Discount;
  vatApplicable: boolean;
  extraTaxes: Array<DocumentTax & { amount?: number }>;
  depositPercent: number | null;
  terms: string | null;
  sentAt: string | null;
}

export interface BillingDocumentRequestDto {
  customerId: string;
  projectId: string | null;
  sourceDocumentId: string | null;
  issueDate: string;
  dueDate: string | null;
  validUntil: string | null;
  depositPercent: number;
  terms: string;
  lines: Array<{
    id: string | null;
    description: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    discountType: 'PERCENT' | 'AMOUNT';
    discountValue: number;
    vatRate: number;
  }>;
  globalDiscount: Discount;
  vatApplicable: boolean;
  extraTaxes: Array<{ id: string | null; label: string; rate: number }>;
  draft: boolean;
}

export interface PaymentDto {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
  reference: string | null;
  note: string | null;
}

export interface ReminderRuleDto {
  id: string;
  labelKey: string;
  offsetDays: number;
  channel: 'EMAIL';
  templateKey: string;
  active: boolean;
}

export interface ReminderDto {
  id: string;
  invoiceId: string;
  ruleId: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  content: string | null;
}
