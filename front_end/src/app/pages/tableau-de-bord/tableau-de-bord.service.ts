import { Injectable, computed, inject } from '@angular/core';
import { arrondi } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { CampagneService } from '../campagnes/campagne.service';
import { FactureService } from '../factures/facture.service';
import { PaiementService } from '../paiements/paiement.service';
import { RelanceService } from '../relances/relance.service';

export interface PointRevenu {
  mois: string;
  libelle: string;
  montant: number;
  /** Hauteur relative de la barre, en pourcentage. */
  part: number;
}

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

@Injectable({ providedIn: 'root' })
export class TableauDeBordService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly paiements = inject(PaiementService);
  private readonly campagnes = inject(CampagneService);
  private readonly relances = inject(RelanceService);

  readonly createur = this.store.createur.asReadonly();
  readonly devise = this.store.devise;
  readonly onboarding = this.store.onboarding;

  readonly chiffreAffaires = this.factures.chiffreAffaires;
  readonly encaisse = this.factures.totalEncaisse;
  readonly enAttente = this.factures.totalEnAttente;
  readonly enRetard = this.factures.totalEnRetard;
  readonly nbEnRetard = computed(() => this.factures.enRetard().length);
  readonly prochainesEcheances = this.factures.prochainesEcheances;
  readonly campagnesActives = this.campagnes.actives;
  readonly aRelancer = computed(() => this.relances.fileAttente().length);

  readonly facturesRecentes = computed(() => this.factures.liste().slice(0, 5));
  readonly activites = computed(() => this.store.activites().slice(0, 6));

  /** Revenus encaissés des six derniers mois, normalisés pour l'affichage. */
  readonly revenusSixMois = computed<PointRevenu[]>(() => {
    const paiements = this.paiements.liste();
    const reference = new Date();
    const points: PointRevenu[] = [];

    for (let recul = 5; recul >= 0; recul -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - recul, 1);
      const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const montant = arrondi(
        paiements.filter((p) => p.date.startsWith(mois)).reduce((somme, p) => somme + p.montant, 0),
      );

      points.push({ mois, libelle: MOIS_COURTS[date.getMonth()], montant, part: 0 });
    }

    const maximum = Math.max(...points.map((p) => p.montant), 1);
    return points.map((point) => ({
      ...point,
      part: Math.max(4, Math.round((point.montant / maximum) * 100)),
    }));
  });

  readonly onboardingRestant = computed(() => this.onboarding().filter((tache) => !tache.fait));
}
