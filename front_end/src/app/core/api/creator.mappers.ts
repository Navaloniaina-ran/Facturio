/**
 * Conversion entre les réponses de l'API et les modèles du front. Le backend
 * publie des champs annulables et des statuts en texte libre ; les écrans, eux,
 * travaillent sur des modèles complets et typés.
 */

import { countryNameOf } from '../countries';
import {
  BillingCycle,
  Brand,
  Campaign,
  CampaignStatus,
  Collaboration,
  CollaborationStage,
  CollaborationType,
  Creator,
  Line,
  PlanCode,
  PlatformInvoice,
  Settings,
  Subscription,
  SubscriptionStatus,
} from '../models';
import {
  BrandDto,
  CampaignDto,
  CollaborationDto,
  CreatorProfileDto,
  PlatformInvoiceDto,
  SettingsDto,
  SubscriptionDto,
} from './api.dto';

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'DRAFT',
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];

const COLLABORATION_STAGES: CollaborationStage[] = [
  'PROSPECT',
  'NEGOTIATION',
  'CONTRACT',
  'IN_PROGRESS',
  'DONE',
  'LOST',
];

const COLLABORATION_TYPE_VALUES: CollaborationType[] = [
  'SPONSORED',
  'AMBASSADOR',
  'UGC',
  'EVENT',
  'AFFILIATE',
];

const PLANS: PlanCode[] = ['FREE', 'PRO', 'STUDIO'];

const CYCLES: BillingCycle[] = ['MONTHLY', 'ANNUAL'];

const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'TRIAL',
  'ACTIVE',
  'UNPAID',
  'SUSPENDED',
  'CANCELLED',
];

const SUB_PROFILES: Creator['subProfile'][] = ['INFLUENCER', 'CREATOR', 'FREELANCE'];

function text(value: string | null | undefined): string {
  return value ?? '';
}

function oneOf<T extends string>(value: string | null | undefined, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Le backend stocke une URL de contrat ; l'écran n'affiche que le fichier. */
function fileNameOf(url: string | null): string | null {
  return url ? (url.split('/').pop() ?? url) : null;
}

export function toBrand(dto: BrandDto): Brand {
  return {
    id: dto.id,
    name: text(dto.name),
    contact: text(dto.contact),
    email: text(dto.email),
    phone: text(dto.phone),
    address: text(dto.address),
    countryCode: dto.countryCode ?? 'FR',
    paymentTermsDays: dto.paymentTermsDays,
    notes: text(dto.notes),
    remindersPaused: dto.remindersPaused,
  };
}

/**
 * `quoteAccepted` n'a pas d'équivalent côté API : c'est un jalon de la chaîne
 * commerciale tenu par le front tant que la facturation n'est pas branchée.
 * Une campagne rechargée repart donc de la valeur portée par le serveur.
 */
export function toCampaign(dto: CampaignDto, previous?: Campaign): Campaign {
  return {
    id: dto.id,
    brandId: dto.brandId,
    name: dto.name,
    startDate: dto.startDate,
    endDate: dto.endDate,
    status: oneOf(dto.status, CAMPAIGN_STATUSES, 'DRAFT'),
    deliverables: Array.isArray(dto.deliverables) ? (dto.deliverables as Line[]) : [],
    contractName: fileNameOf(dto.contractUrl) ?? previous?.contractName ?? null,
    quoteAccepted: previous?.quoteAccepted ?? false,
    contractSigned: dto.contractSigned,
  };
}

export function toCollaboration(dto: CollaborationDto): Collaboration {
  return {
    id: dto.id,
    brandId: dto.brandId,
    title: dto.title,
    type: oneOf(dto.type, COLLABORATION_TYPE_VALUES, 'SPONSORED'),
    stage: oneOf(dto.stage, COLLABORATION_STAGES, 'PROSPECT'),
    estimatedAmount: Number(dto.estimatedAmount ?? 0),
    contactDate: dto.contactDate,
    nextStepDate: dto.nextStepDate,
    nextStepNote: text(dto.nextStepNote),
    notes: text(dto.notes),
    campaignId: dto.campaignId,
    contractName: fileNameOf(dto.contractUrl),
  };
}

export function toCreator(dto: CreatorProfileDto): Creator {
  return {
    id: dto.id,
    name: dto.name,
    handle: text(dto.handle),
    email: dto.email,
    subProfile: oneOf(dto.subProfile, SUB_PROFILES, 'CREATOR'),
    platforms: dto.platforms ?? [],
    niche: text(dto.niche),
    country: countryNameOf(dto.countryCode),
    currency: dto.currency,
    vatRegistered: dto.vatRegistered,
    plan: oneOf(dto.plan, PLANS, 'FREE'),
  };
}

export function toSettings(dto: SettingsDto, fallback: Settings): Settings {
  return {
    businessName: dto.businessName,
    address: text(dto.address),
    countryCode: dto.countryCode,
    taxId: text(dto.taxId),
    bankDetails: text(dto.bankDetails),
    logo: dto.logo,
    accentColor: dto.accentColor ?? fallback.accentColor,
    invoicePrefix: dto.invoicePrefix,
    quotePrefix: dto.quotePrefix,
    creditPrefix: dto.creditPrefix,
    defaultPaymentTermsDays: dto.defaultPaymentTermsDays,
    defaultTerms: text(dto.defaultTerms),
    legalMentions: text(dto.legalMentions),
    latePaymentMention: text(dto.latePaymentMention),
    vatExemptionMention: text(dto.vatExemptionMention),
    invoiceFooter: text(dto.invoiceFooter),
    currency: dto.currency,
  };
}

export function toSubscription(dto: SubscriptionDto): Subscription {
  return {
    plan: oneOf(dto.plan, PLANS, 'FREE'),
    status: oneOf(dto.status, SUBSCRIPTION_STATUSES, 'ACTIVE'),
    cycle: oneOf(dto.cycle, CYCLES, 'MONTHLY'),
    startDate: dto.startDate,
    trialEndDate: dto.trialEndDate,
    nextBillingDate: dto.nextBillingDate,
    cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
  };
}

export function toPlatformInvoice(dto: PlatformInvoiceDto): PlatformInvoice {
  return {
    id: dto.id,
    number: dto.number,
    date: dto.date,
    plan: oneOf(dto.plan, PLANS, 'FREE'),
    cycle: oneOf(dto.cycle, CYCLES, 'MONTHLY'),
    amount: Number(dto.amount ?? 0),
    status: dto.status === 'PAID' ? 'PAID' : 'UNPAID',
  };
}
