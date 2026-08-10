import { Facture, Ligne, Paiement, StatutFacture } from './modeles';

/** Arrondi monétaire à deux décimales. */
export function arrondi(valeur: number): number {
  return Math.round((valeur + Number.EPSILON) * 100) / 100;
}

/** quantité × prix_unitaire, puis remise de ligne. */
export function totalLigne(ligne: Ligne): number {
  const brut = ligne.quantite * ligne.prixUnitaire;
  return brut - (brut * ligne.remisePourcent) / 100;
}

export interface VentilationTva {
  taux: number;
  base: number;
  montant: number;
}

export interface Totaux {
  totalHt: number;
  ventilationTva: VentilationTva[];
  totalTva: number;
  totalTtc: number;
}

/**
 * Règle du cahier des charges : la TVA est calculée par taux et arrondie
 * à deux décimales au niveau de chaque taux, jamais au niveau de la ligne.
 */
export function calculerTotaux(lignes: Ligne[], remiseGlobalePourcent = 0): Totaux {
  const coefficient = 1 - remiseGlobalePourcent / 100;
  const bases = new Map<number, number>();

  for (const ligne of lignes) {
    const base = totalLigne(ligne) * coefficient;
    bases.set(ligne.tauxTva, (bases.get(ligne.tauxTva) ?? 0) + base);
  }

  const ventilationTva = [...bases.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([taux, base]) => ({
      taux,
      base: arrondi(base),
      montant: arrondi((base * taux) / 100),
    }));

  const totalHt = arrondi(ventilationTva.reduce((somme, v) => somme + v.base, 0));
  const totalTva = arrondi(ventilationTva.reduce((somme, v) => somme + v.montant, 0));

  return { totalHt, ventilationTva, totalTva, totalTtc: arrondi(totalHt + totalTva) };
}

export function totalTtcFacture(facture: Facture): number {
  return calculerTotaux(facture.lignes).totalTtc;
}

export function montantPaye(factureId: string, paiements: Paiement[]): number {
  return arrondi(
    paiements.filter((p) => p.factureId === factureId).reduce((somme, p) => somme + p.montant, 0),
  );
}

/** Reste dû = Total TTC − somme des paiements enregistrés. */
export function resteDu(facture: Facture, paiements: Paiement[]): number {
  return arrondi(totalTtcFacture(facture) - montantPaye(facture.id, paiements));
}

/** Montant de l'acompte demandé sur le document. */
export function montantAcompte(facture: Facture): number {
  return arrondi((totalTtcFacture(facture) * facture.acomptePourcent) / 100);
}

export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ajouterJours(date: string, jours: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export function ecartEnJours(depuis: string, jusqu: string): number {
  const a = new Date(depuis + 'T00:00:00Z').getTime();
  const b = new Date(jusqu + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86_400_000);
}

/** date du jour − date d'échéance, uniquement si le reste dû est > 0. */
export function joursDeRetard(facture: Facture, paiements: Paiement[], date = aujourdhui()): number {
  if (resteDu(facture, paiements) <= 0) {
    return 0;
  }
  return Math.max(0, ecartEnJours(facture.dateEcheance, date));
}

/**
 * Recalcul quotidien du statut (P08). Les statuts terminaux
 * BROUILLON et ANNULEE ne sont jamais recalculés.
 */
export function statutRecalcule(
  facture: Facture,
  paiements: Paiement[],
  date = aujourdhui(),
): StatutFacture {
  if (facture.statut === 'BROUILLON' || facture.statut === 'ANNULEE') {
    return facture.statut;
  }

  const paye = montantPaye(facture.id, paiements);
  const total = totalTtcFacture(facture);

  if (paye >= total) {
    return 'PAYEE';
  }
  if (ecartEnJours(facture.dateEcheance, date) > 0) {
    return 'EN_RETARD';
  }
  return paye > 0 ? 'PARTIELLEMENT_PAYEE' : 'ENVOYEE';
}

/** Numérotation {PRÉFIXE}-{ANNÉE}-{COMPTEUR} sans trou. */
export function numeroDocument(prefixe: string, annee: number, compteur: number): string {
  return `${prefixe}-${annee}-${String(compteur).padStart(4, '0')}`;
}

/** Moyenne, sur les factures soldées, de date du dernier paiement − date d'émission. */
export function delaiMoyenPaiement(factures: Facture[], paiements: Paiement[]): number {
  const delais: number[] = [];

  for (const facture of factures) {
    const versements = paiements.filter((p) => p.factureId === facture.id);
    if (!versements.length || resteDu(facture, paiements) > 0) {
      continue;
    }
    const dernier = versements.map((p) => p.date).sort().at(-1)!;
    delais.push(ecartEnJours(facture.dateEmission, dernier));
  }

  if (!delais.length) {
    return 0;
  }
  return Math.round(delais.reduce((s, d) => s + d, 0) / delais.length);
}
