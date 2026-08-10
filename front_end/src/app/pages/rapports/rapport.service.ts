import { Injectable, computed, inject } from '@angular/core';
import { arrondi, delaiMoyenPaiement, totalLigne } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { LIBELLES_LIVRABLE } from '../../core/libelles';
import { QUOTAS } from '../../core/quotas';
import { FactureService } from '../factures/facture.service';
import { MarqueService } from '../marques/marque.service';
import { PropositionService } from '../propositions/proposition.service';

export interface LigneRapport {
  libelle: string;
  montant: number;
  part: number;
}

export interface TrancheAnciennete {
  libelle: string;
  nb: number;
  montant: number;
}

@Injectable({ providedIn: 'root' })
export class RapportService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly marques = inject(MarqueService);
  private readonly propositions = inject(PropositionService);

  readonly rapportsAvances = computed(() => QUOTAS[this.store.createur().plan].rapportsAvances);

  readonly chiffreAffaires = this.factures.chiffreAffaires;
  readonly encaisse = this.factures.totalEncaisse;
  readonly tauxAcceptation = this.propositions.tauxAcceptation;

  readonly delaiMoyen = computed(() =>
    delaiMoyenPaiement(this.store.factures(), this.store.paiements()),
  );

  /** Taux d'impayés : part du facturé encore due. */
  readonly tauxImpayes = computed(() => {
    const facture = this.chiffreAffaires();
    if (!facture) {
      return 0;
    }
    const du = arrondi(
      this.factures
        .liste()
        .filter((f) => f.statut !== 'ANNULEE' && f.statut !== 'BROUILLON')
        .reduce((somme, f) => somme + f.resteDu, 0),
    );
    return Math.round((du / facture) * 100);
  });

  /** Top marques par montant facturé. */
  readonly topMarques = computed<LigneRapport[]>(() => this.classer(
    this.marques.liste().map((m) => ({ libelle: m.nom, montant: m.totalFacture })),
  ));

  /** Revenus par type de livrable — spécifique à l'espace créateur. */
  readonly revenusParLivrable = computed<LigneRapport[]>(() => {
    const totaux = new Map<string, number>();

    for (const facture of this.factures.liste()) {
      if (facture.statut === 'ANNULEE' || facture.statut === 'BROUILLON') {
        continue;
      }
      for (const ligne of facture.lignes) {
        const libelle = LIBELLES_LIVRABLE[ligne.typeLivrable];
        totaux.set(libelle, (totaux.get(libelle) ?? 0) + totalLigne(ligne));
      }
    }

    return this.classer([...totaux].map(([libelle, montant]) => ({ libelle, montant: arrondi(montant) })));
  });

  /** Balance âgée des impayés. */
  readonly anciennete = computed<TrancheAnciennete[]>(() => {
    const tranches: TrancheAnciennete[] = [
      { libelle: 'Non échu', nb: 0, montant: 0 },
      { libelle: '1 à 15 jours', nb: 0, montant: 0 },
      { libelle: '16 à 30 jours', nb: 0, montant: 0 },
      { libelle: 'Plus de 30 jours', nb: 0, montant: 0 },
    ];

    for (const facture of this.factures.liste()) {
      if (facture.resteDu <= 0 || facture.statut === 'BROUILLON' || facture.statut === 'ANNULEE') {
        continue;
      }
      const retard = facture.joursRetard;
      const index = retard === 0 ? 0 : retard <= 15 ? 1 : retard <= 30 ? 2 : 3;
      tranches[index].nb += 1;
      tranches[index].montant = arrondi(tranches[index].montant + facture.resteDu);
    }

    return tranches;
  });

  /** Chiffre d'affaires mensuel des douze derniers mois. */
  readonly caMensuel = computed<LigneRapport[]>(() => {
    const reference = new Date();
    const points: { libelle: string; montant: number }[] = [];

    for (let recul = 11; recul >= 0; recul -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - recul, 1);
      const mois = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const montant = arrondi(
        this.factures
          .liste()
          .filter((f) => f.dateEmission.startsWith(mois) && f.statut !== 'ANNULEE')
          .reduce((somme, f) => somme + f.totalTtc, 0),
      );
      points.push({ libelle: mois, montant });
    }

    const maximum = Math.max(...points.map((p) => p.montant), 1);
    return points.map((p) => ({ ...p, part: Math.max(2, Math.round((p.montant / maximum) * 100)) }));
  });

  /** Export CSV du rapport de synthèse. */
  versCsv(): string {
    const lignes = [
      ['Indicateur', 'Valeur'],
      ['Chiffre d affaires', this.chiffreAffaires()],
      ['Encaisse', this.encaisse()],
      ['Taux d impayes (%)', this.tauxImpayes()],
      ['Delai moyen de paiement (jours)', this.delaiMoyen()],
      ['Taux d acceptation des propositions (%)', this.tauxAcceptation()],
    ];

    return lignes.map((ligne) => ligne.join(';')).join('\n');
  }

  private classer(entrees: { libelle: string; montant: number }[]): LigneRapport[] {
    const triees = entrees.filter((e) => e.montant > 0).sort((a, b) => b.montant - a.montant);
    const maximum = Math.max(...triees.map((e) => e.montant), 1);

    return triees.map((entree) => ({
      ...entree,
      part: Math.max(4, Math.round((entree.montant / maximum) * 100)),
    }));
  }
}
