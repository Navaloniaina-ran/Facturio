import { PlanCode } from './models';

export type Plan = PlanCode;

export interface Quota {
  /** null = illimité. */
  brands: number | null;
  invoicesPerMonth: number | null;
  /** Nombre d'étapes de relance activables, null = illimité. */
  reminderSteps: number | null;
  campaigns: boolean;
  collaborations: boolean;
  /** Logo et couleur d'accentuation sur les documents. */
  branding: boolean;
  advancedReports: boolean;
  /** Exports CSV des marques et des rapports. */
  exports: boolean;
  aiRequests: number;
}

/**
 * Trois offres : découverte gratuite, 19 € pour un créateur qui facture
 * régulièrement, 59 € pour un studio qui n'a plus de plafond.
 */
export const QUOTAS: Record<Plan, Quota> = {
  FREE: {
    brands: 3,
    invoicesPerMonth: 5,
    reminderSteps: 0,
    campaigns: false,
    collaborations: false,
    branding: false,
    advancedReports: false,
    exports: false,
    aiRequests: 10,
  },
  PRO: {
    brands: 50,
    invoicesPerMonth: 50,
    reminderSteps: 3,
    campaigns: true,
    collaborations: true,
    branding: true,
    advancedReports: false,
    exports: true,
    aiRequests: 150,
  },
  STUDIO: {
    brands: null,
    invoicesPerMonth: null,
    reminderSteps: null,
    campaigns: true,
    collaborations: true,
    branding: true,
    advancedReports: true,
    exports: true,
    aiRequests: 600,
  },
};

/** Ordre commercial des offres, de la découverte au sans-limite. */
export const PLAN_ORDER: Plan[] = ['FREE', 'PRO', 'STUDIO'];

export const NEXT_PLAN: Record<Plan, Plan | null> = {
  FREE: 'PRO',
  PRO: 'STUDIO',
  STUDIO: null,
};

export type CountableQuota = keyof Pick<Quota, 'brands' | 'invoicesPerMonth' | 'reminderSteps'>;

/** Blocage traduisible : le message reste une clé, jamais une phrase figée. */
export interface QuotaBlock {
  errorKey: string;
  params: Record<string, string | number>;
  nextPlan: Plan | null;
}

/**
 * Un dépassement de quota ne provoque jamais d'erreur technique :
 * il renvoie de quoi afficher la limite atteinte et l'offre supérieure.
 */
export function checkLimit(plan: Plan, limit: CountableQuota, used: number): QuotaBlock | null {
  const maximum = QUOTAS[plan][limit];
  if (maximum === null || used < maximum) {
    return null;
  }

  const next = NEXT_PLAN[plan];
  const nextMaximum = next ? QUOTAS[next][limit] : null;

  return {
    errorKey: 'quota.limit',
    params: {
      plan,
      limit: maximum,
      item: `quota.item.${limit}`,
      nextPlan: next ?? '',
      nextLimit: nextMaximum ?? '',
    },
    nextPlan: next,
  };
}
