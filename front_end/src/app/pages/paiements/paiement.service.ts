import { Injectable, computed, inject } from '@angular/core';
import { arrondi, aujourdhui } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { MethodePaiement, Paiement } from '../../core/modeles';
import { FactureService } from '../factures/facture.service';
import { RelanceService } from '../relances/relance.service';

export interface PaiementVue extends Paiement {
  factureNumero: string;
  marqueNom: string;
}

export interface SaisiePaiement {
  factureId: string;
  montant: number;
  date: string;
  methode: MethodePaiement;
  reference: string;
  note: string;
}

export interface ResultatPaiement {
  ok: boolean;
  message?: string;
  /** Vrai lorsque ce paiement a soldé la facture. */
  facturePayee?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaiementService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly relances = inject(RelanceService);

  readonly liste = computed<PaiementVue[]>(() =>
    this.store
      .paiements()
      .map((paiement) => {
        const facture = this.store.factures().find((f) => f.id === paiement.factureId);
        return {
          ...paiement,
          factureNumero: facture?.numero || 'Brouillon',
          marqueNom: facture ? this.store.nomMarque(facture.marqueId) : '—',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  readonly totalEncaisse = computed(() =>
    arrondi(this.liste().reduce((somme, p) => somme + p.montant, 0)),
  );

  readonly encaissementsDuMois = computed(() => {
    const mois = aujourdhui().slice(0, 7);
    return arrondi(
      this.liste()
        .filter((p) => p.date.startsWith(mois))
        .reduce((somme, p) => somme + p.montant, 0),
    );
  });

  /** Somme des restes dus des factures envoyées ou partiellement payées. */
  readonly enAttente = computed(() => this.factures.totalEnAttente());

  readonly enRetard = computed(() => this.factures.totalEnRetard());

  parFacture(factureId: string): PaiementVue[] {
    return this.liste().filter((p) => p.factureId === factureId);
  }

  /**
   * Enregistre un versement. Un paiement ne peut pas dépasser le reste dû ;
   * dès que la facture est soldée, les relances en attente sont annulées.
   */
  enregistrer(saisie: SaisiePaiement): ResultatPaiement {
    const facture = this.factures.parId(saisie.factureId);
    if (!facture) {
      return { ok: false, message: 'Facture introuvable.' };
    }
    if (saisie.montant <= 0) {
      return { ok: false, message: 'Le montant doit être supérieur à zéro.' };
    }
    if (saisie.montant > facture.resteDu) {
      return {
        ok: false,
        message: `Le montant dépasse le reste dû (${facture.resteDu} ${this.store.devise()}).`,
      };
    }

    const paiement: Paiement = { ...saisie, id: this.store.nouvelId('p') };
    this.store.paiements.update((paiements) => [paiement, ...paiements]);
    this.factures.recalculerStatuts();

    const solde = this.factures.parId(saisie.factureId)?.resteDu ?? 0;
    if (solde <= 0) {
      this.relances.annulerPour(saisie.factureId);
    }

    this.store.journaliser(
      'PAIEMENT',
      `Paiement de ${saisie.montant} ${this.store.devise()} reçu sur ${facture.numero || 'un brouillon'}`,
    );

    return { ok: true, facturePayee: solde <= 0 };
  }

  /** Toute suppression est tracée et recalcule le statut de la facture. */
  supprimer(id: string): void {
    const paiement = this.liste().find((p) => p.id === id);
    this.store.paiements.update((paiements) => paiements.filter((p) => p.id !== id));
    this.factures.recalculerStatuts();

    if (paiement) {
      this.store.journaliser(
        'PAIEMENT',
        `Paiement de ${paiement.montant} ${this.store.devise()} supprimé sur ${paiement.factureNumero}`,
      );
    }
  }
}
