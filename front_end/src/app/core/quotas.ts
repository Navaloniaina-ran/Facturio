import { Createur } from './modeles';

export type Plan = Createur['plan'];

export interface Quota {
  /** null = illimité. */
  marques: number | null;
  facturesParMois: number | null;
  /** Nombre d'étapes de relance activables, null = illimité. */
  etapesRelance: number | null;
  campagnes: boolean;
  rapportsAvances: boolean;
  requetesIa: number;
}

/** Grille de quotas du chapitre 15.4 du cahier des charges. */
export const QUOTAS: Record<Plan, Quota> = {
  FREE: { marques: 3, facturesParMois: 5, etapesRelance: 0, campagnes: false, rapportsAvances: false, requetesIa: 10 },
  STARTER: { marques: 50, facturesParMois: 50, etapesRelance: 2, campagnes: false, rapportsAvances: false, requetesIa: 100 },
  PRO: { marques: null, facturesParMois: null, etapesRelance: null, campagnes: true, rapportsAvances: true, requetesIa: 500 },
  BUSINESS: { marques: null, facturesParMois: null, etapesRelance: null, campagnes: true, rapportsAvances: true, requetesIa: 2000 },
};

export const PLAN_SUIVANT: Record<Plan, Plan | null> = {
  FREE: 'STARTER',
  STARTER: 'PRO',
  PRO: 'BUSINESS',
  BUSINESS: null,
};

export interface Blocage {
  message: string;
  planSuivant: Plan | null;
}

/**
 * Un dépassement de quota ne provoque jamais d'erreur technique :
 * il renvoie un message explicite et l'offre supérieure à proposer.
 */
export function verifierLimite(
  plan: Plan,
  limite: keyof Pick<Quota, 'marques' | 'facturesParMois' | 'etapesRelance'>,
  utilise: number,
  intitule: string,
): Blocage | null {
  const maximum = QUOTAS[plan][limite];
  if (maximum === null || utilise < maximum) {
    return null;
  }

  const suivant = PLAN_SUIVANT[plan];
  const maximumSuivant = suivant ? QUOTAS[suivant][limite] : null;
  const promesse = suivant
    ? ` L'offre ${suivant} en autorise ${maximumSuivant === null ? 'un nombre illimité' : maximumSuivant}.`
    : '';

  return {
    message: `Limite atteinte : votre offre ${plan} autorise ${maximum} ${intitule}.${promesse}`,
    planSuivant: suivant,
  };
}
