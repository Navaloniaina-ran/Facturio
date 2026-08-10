import { Injectable, computed, signal } from '@angular/core';
import { aujourdhui, numeroDocument } from './calculs';
import {
  CAMPAGNES_DEMO,
  CREATEUR_DEMO,
  ETAPES_RELANCE_DEMO,
  FACTURES_DEMO,
  MARQUES_DEMO,
  PAIEMENTS_DEMO,
  PROPOSITIONS_DEMO,
} from './donnees-demo';
import {
  Activite,
  Campagne,
  Createur,
  EtapeRelance,
  Facture,
  Marque,
  Paiement,
  Proposition,
  Relance,
} from './modeles';

export type ModeRelance = 'AUTO' | 'VALIDATION';

/**
 * Source de vérité unique de l'espace de travail courant.
 * Les services métier (marque, facture, paiement…) lisent et écrivent ici :
 * cela évite toute dépendance circulaire entre eux.
 *
 * En production, ces signaux seraient alimentés par l'API NestJS ;
 * ici les données sont en mémoire pour rendre le front démontrable seul.
 */
@Injectable({ providedIn: 'root' })
export class EspaceStoreService {
  readonly createur = signal<Createur>(structuredClone(CREATEUR_DEMO));
  readonly marques = signal<Marque[]>(structuredClone(MARQUES_DEMO));
  readonly campagnes = signal<Campagne[]>(structuredClone(CAMPAGNES_DEMO));
  readonly propositions = signal<Proposition[]>(structuredClone(PROPOSITIONS_DEMO));
  readonly factures = signal<Facture[]>(structuredClone(FACTURES_DEMO));
  readonly paiements = signal<Paiement[]>(structuredClone(PAIEMENTS_DEMO));
  readonly etapesRelance = signal<EtapeRelance[]>(structuredClone(ETAPES_RELANCE_DEMO));
  readonly relances = signal<Relance[]>([]);
  readonly modeRelance = signal<ModeRelance>('VALIDATION');
  readonly activites = signal<Activite[]>([]);

  private readonly compteurs = new Map<string, number>([
    ['FAC', FACTURES_DEMO.length],
    ['PRO', PROPOSITIONS_DEMO.length],
  ]);
  private sequence = 100;

  readonly devise = computed(() => this.createur().devise);

  /** Tâches d'onboarding progressif restant à cocher (P12). */
  readonly onboarding = computed(() => {
    const createur = this.createur();
    return [
      { cle: 'logo', libelle: 'Ajouter votre logo', fait: createur.logo !== null },
      { cle: 'banque', libelle: 'Renseigner vos coordonnées bancaires', fait: createur.coordonneesBancaires !== null },
      { cle: 'marque', libelle: 'Créer votre première marque', fait: this.marques().length > 0 },
      { cle: 'facture', libelle: 'Émettre votre première facture', fait: this.factures().length > 0 },
    ];
  });

  nouvelId(prefixe: string): string {
    this.sequence += 1;
    return `${prefixe}${this.sequence}`;
  }

  /** Compteur séquentiel sans trou, attribué à la validation du document. */
  prochainNumero(prefixe: 'FAC' | 'PRO'): string {
    const compteur = (this.compteurs.get(prefixe) ?? 0) + 1;
    this.compteurs.set(prefixe, compteur);
    return numeroDocument(prefixe, new Date().getFullYear(), compteur);
  }

  marque(id: string): Marque | undefined {
    return this.marques().find((m) => m.id === id);
  }

  nomMarque(id: string): string {
    return this.marque(id)?.nom ?? '—';
  }

  campagne(id: string | null): Campagne | undefined {
    return id ? this.campagnes().find((c) => c.id === id) : undefined;
  }

  journaliser(type: Activite['type'], libelle: string): void {
    const activite: Activite = { id: this.nouvelId('a'), date: aujourdhui(), libelle, type };
    this.activites.update((liste) => [activite, ...liste].slice(0, 20));
  }
}
