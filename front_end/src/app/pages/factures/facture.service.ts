import { Injectable, computed, inject } from '@angular/core';
import {
  ajouterJours,
  arrondi,
  aujourdhui,
  calculerTotaux,
  ecartEnJours,
  joursDeRetard,
  montantPaye,
  resteDu,
  statutRecalcule,
} from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { Facture, Ligne, Paiement, StatutFacture } from '../../core/modeles';
import { Blocage, verifierLimite } from '../../core/quotas';

/** Facture enrichie des montants calculés : ce que les écrans affichent. */
export interface FactureVue extends Facture {
  marqueNom: string;
  campagneNom: string | null;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  montantPaye: number;
  resteDu: number;
  joursRetard: number;
  /** Acompte demandé sur le document. */
  acompte: number;
}

export interface SaisieFacture {
  marqueId: string;
  campagneId: string | null;
  propositionId: string | null;
  dateEmission: string;
  dateEcheance: string;
  acomptePourcent: number;
  conditions: string;
  lignes: Ligne[];
  /** Un brouillon ne consomme pas de numéro (numérotation sans trou). */
  brouillon: boolean;
}

export interface ResultatCreation {
  ok: boolean;
  facture?: FactureVue;
  blocage?: Blocage;
}

@Injectable({ providedIn: 'root' })
export class FactureService {
  private readonly store = inject(EspaceStoreService);

  /** Toutes les factures, statut recalculé et montants à jour. */
  readonly liste = computed<FactureVue[]>(() => {
    const paiements = this.store.paiements();
    const jour = aujourdhui();

    return this.store
      .factures()
      .map((facture) => this.enrichir(facture, paiements, jour))
      .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));
  });

  readonly nonAnnulees = computed(() => this.liste().filter((f) => f.statut !== 'ANNULEE'));

  /** Chiffre d'affaires émis (hors brouillons et factures annulées). */
  readonly chiffreAffaires = computed(() =>
    arrondi(
      this.nonAnnulees()
        .filter((f) => f.statut !== 'BROUILLON')
        .reduce((somme, f) => somme + f.totalTtc, 0),
    ),
  );

  readonly totalEncaisse = computed(() =>
    arrondi(this.nonAnnulees().reduce((somme, f) => somme + f.montantPaye, 0)),
  );

  readonly totalEnAttente = computed(() =>
    arrondi(
      this.nonAnnulees()
        .filter((f) => f.statut === 'ENVOYEE' || f.statut === 'PARTIELLEMENT_PAYEE')
        .reduce((somme, f) => somme + f.resteDu, 0),
    ),
  );

  readonly totalEnRetard = computed(() =>
    arrondi(
      this.enRetard().reduce((somme, f) => somme + f.resteDu, 0),
    ),
  );

  readonly enRetard = computed(() => this.liste().filter((f) => f.statut === 'EN_RETARD'));

  /** Échéances des 7 prochains jours (widget du tableau de bord). */
  readonly prochainesEcheances = computed(() =>
    this.liste()
      .filter((f) => {
        if (f.resteDu <= 0 || f.statut === 'BROUILLON' || f.statut === 'ANNULEE') {
          return false;
        }
        const jours = ecartEnJours(aujourdhui(), f.dateEcheance);
        return jours >= 0 && jours <= 7;
      })
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance)),
  );

  parId(id: string): FactureVue | undefined {
    return this.liste().find((f) => f.id === id);
  }

  parMarque(marqueId: string): FactureVue[] {
    return this.liste().filter((f) => f.marqueId === marqueId);
  }

  /** Tâche planifiée quotidienne : persiste le statut recalculé (P08). */
  recalculerStatuts(): void {
    const paiements = this.store.paiements();
    const jour = aujourdhui();

    this.store.factures.update((factures) =>
      factures.map((facture) => {
        const statut = statutRecalcule(facture, paiements, jour);
        return statut === facture.statut ? facture : { ...facture, statut };
      }),
    );
  }

  creer(saisie: SaisieFacture): ResultatCreation {
    const blocage = this.verifierQuotaMensuel();
    if (blocage) {
      return { ok: false, blocage };
    }

    const facture: Facture = {
      id: this.store.nouvelId('f'),
      numero: saisie.brouillon ? '' : this.store.prochainNumero('FAC'),
      marqueId: saisie.marqueId,
      campagneId: saisie.campagneId,
      propositionId: saisie.propositionId,
      dateEmission: saisie.dateEmission,
      dateEcheance: saisie.dateEcheance,
      statut: saisie.brouillon ? 'BROUILLON' : 'ENVOYEE',
      lignes: saisie.lignes,
      acomptePourcent: saisie.acomptePourcent,
      conditions: saisie.conditions,
    };

    this.store.factures.update((factures) => [facture, ...factures]);
    this.store.journaliser(
      'FACTURE',
      saisie.brouillon
        ? `Brouillon de facture créé pour ${this.store.nomMarque(facture.marqueId)}`
        : `Facture ${facture.numero} émise pour ${this.store.nomMarque(facture.marqueId)}`,
    );

    return { ok: true, facture: this.parId(facture.id) };
  }

  /** Échéance par défaut selon les conditions de paiement de la marque. */
  echeanceParDefaut(marqueId: string, dateEmission = aujourdhui()): string {
    const jours = this.store.marque(marqueId)?.conditionsPaiementJours ?? 30;
    return ajouterJours(dateEmission, jours);
  }

  /** Validation d'un brouillon : le numéro est attribué à cet instant. */
  envoyer(id: string): void {
    this.store.factures.update((factures) =>
      factures.map((facture) => {
        if (facture.id !== id) {
          return facture;
        }
        const numero = facture.numero || this.store.prochainNumero('FAC');
        return { ...facture, numero, statut: 'ENVOYEE' as StatutFacture };
      }),
    );
    this.store.journaliser('FACTURE', `Facture ${this.parId(id)?.numero} envoyée par email`);
  }

  annuler(id: string): void {
    this.majStatut(id, 'ANNULEE');
    this.store.journaliser('FACTURE', `Facture ${this.parId(id)?.numero} annulée`);
  }

  dupliquer(id: string): ResultatCreation {
    const source = this.parId(id);
    if (!source) {
      return { ok: false };
    }

    return this.creer({
      marqueId: source.marqueId,
      campagneId: source.campagneId,
      propositionId: null,
      dateEmission: aujourdhui(),
      dateEcheance: this.echeanceParDefaut(source.marqueId),
      acomptePourcent: source.acomptePourcent,
      conditions: source.conditions,
      lignes: source.lignes.map((ligne) => ({ ...ligne, id: this.store.nouvelId('l') })),
      brouillon: true,
    });
  }

  /** Une facture envoyée n'est pas modifiable : toute correction passe par un avoir. */
  genererAvoir(id: string): ResultatCreation {
    const source = this.parId(id);
    if (!source) {
      return { ok: false };
    }

    const resultat = this.creer({
      marqueId: source.marqueId,
      campagneId: source.campagneId,
      propositionId: null,
      dateEmission: aujourdhui(),
      dateEcheance: aujourdhui(),
      acomptePourcent: 0,
      conditions: `Avoir sur la facture ${source.numero}.`,
      lignes: source.lignes.map((ligne) => ({
        ...ligne,
        id: this.store.nouvelId('l'),
        quantite: -ligne.quantite,
      })),
      brouillon: false,
    });

    if (resultat.ok) {
      this.majStatut(id, 'ANNULEE');
    }
    return resultat;
  }

  private verifierQuotaMensuel(): Blocage | null {
    const mois = aujourdhui().slice(0, 7);
    const emisesCeMois = this.store.factures().filter((f) => f.dateEmission.startsWith(mois)).length;

    return verifierLimite(
      this.store.createur().plan,
      'facturesParMois',
      emisesCeMois,
      'factures par mois',
    );
  }

  private majStatut(id: string, statut: StatutFacture): void {
    this.store.factures.update((factures) =>
      factures.map((facture) => (facture.id === id ? { ...facture, statut } : facture)),
    );
  }

  private enrichir(facture: Facture, paiements: Paiement[], jour: string): FactureVue {
    const totaux = calculerTotaux(facture.lignes);
    const statut = statutRecalcule(facture, paiements, jour);

    return {
      ...facture,
      statut,
      marqueNom: this.store.nomMarque(facture.marqueId),
      campagneNom: this.store.campagne(facture.campagneId)?.nom ?? null,
      totalHt: totaux.totalHt,
      totalTva: totaux.totalTva,
      totalTtc: totaux.totalTtc,
      montantPaye: montantPaye(facture.id, paiements),
      resteDu: resteDu(facture, paiements),
      joursRetard: joursDeRetard(facture, paiements, jour),
      acompte: arrondi((totaux.totalTtc * facture.acomptePourcent) / 100),
    };
  }
}
