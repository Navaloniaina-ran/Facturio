import { Injectable, computed, inject } from '@angular/core';
import { ajouterJours, aujourdhui, ecartEnJours } from '../../core/calculs';
import { EspaceStoreService, ModeRelance } from '../../core/espace-store.service';
import { EtapeRelance, Relance } from '../../core/modeles';
import { verifierLimite } from '../../core/quotas';
import { FactureService, FactureVue } from '../factures/facture.service';

export interface ItemRelance {
  facture: FactureVue;
  etape: EtapeRelance;
  datePlanifiee: string;
  /** Négatif avant l'échéance, positif après. */
  decalageReel: number;
}

export interface RelanceVue extends Relance {
  factureNumero: string;
  marqueNom: string;
  etapeLibelle: string;
}

/** Plafond d'envois quotidien, pour préserver la réputation d'expédition. */
export const PLAFOND_ENVOIS_PAR_JOUR = 30;

@Injectable({ providedIn: 'root' })
export class RelanceService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);

  readonly etapes = this.store.etapesRelance.asReadonly();
  readonly mode = this.store.modeRelance.asReadonly();

  readonly historique = computed<RelanceVue[]>(() =>
    this.store
      .relances()
      .map((relance) => {
        const facture = this.factures.parId(relance.factureId);
        return {
          ...relance,
          factureNumero: facture?.numero ?? '—',
          marqueNom: facture?.marqueNom ?? '—',
          etapeLibelle: this.etapes().find((e) => e.id === relance.etapeId)?.libelle ?? '—',
        };
      })
      .sort((a, b) => (b.dateEnvoi ?? b.datePlanifiee).localeCompare(a.dateEnvoi ?? a.datePlanifiee)),
  );

  /** Étapes échues et non encore envoyées : ce qu'il faut traiter aujourd'hui. */
  readonly fileAttente = computed<ItemRelance[]>(() =>
    this.etapesEnAttente().filter((item) => item.datePlanifiee <= aujourdhui()),
  );

  /** Étapes programmées dans les trois jours. */
  readonly aVenir = computed<ItemRelance[]>(() =>
    this.etapesEnAttente().filter((item) => {
      const jours = ecartEnJours(aujourdhui(), item.datePlanifiee);
      return jours > 0 && jours <= 3;
    }),
  );

  readonly nbAujourdhui = computed(
    () => this.fileAttente().filter((item) => item.datePlanifiee === aujourdhui()).length,
  );

  readonly nbEnRetard = computed(
    () => this.fileAttente().filter((item) => item.decalageReel > 0).length,
  );

  readonly nbEnvoyeesCeMois = computed(() => {
    const mois = aujourdhui().slice(0, 7);
    return this.store
      .relances()
      .filter((r) => r.statut === 'ENVOYEE' && (r.dateEnvoi ?? '').startsWith(mois)).length;
  });

  readonly nbEnvoyeesAujourdhui = computed(
    () =>
      this.store.relances().filter((r) => r.statut === 'ENVOYEE' && r.dateEnvoi === aujourdhui())
        .length,
  );

  historiqueFacture(factureId: string): RelanceVue[] {
    return this.historique().filter((r) => r.factureId === factureId);
  }

  definirMode(mode: ModeRelance): void {
    this.store.modeRelance.set(mode);
  }

  /** Active ou désactive une étape, dans la limite autorisée par l'offre. */
  basculerEtape(id: string): { ok: boolean; message?: string } {
    const etape = this.etapes().find((e) => e.id === id);
    if (!etape) {
      return { ok: false };
    }

    if (!etape.active) {
      const actives = this.etapes().filter((e) => e.active).length;
      const blocage = verifierLimite(
        this.store.createur().plan,
        'etapesRelance',
        actives,
        'étapes de relance automatiques',
      );
      if (blocage) {
        return { ok: false, message: blocage.message };
      }
    }

    this.store.etapesRelance.update((etapes) =>
      etapes.map((e) => (e.id === id ? { ...e, active: !e.active } : e)),
    );
    return { ok: true };
  }

  /** Message pré-rempli à partir du modèle de l'étape et des variables de la facture. */
  messagePropose(item: ItemRelance): string {
    const marque = this.store.marque(item.facture.marqueId);
    const contact = marque?.contact ?? item.facture.marqueNom;
    const retard = item.facture.joursRetard;
    const montant = `${item.facture.resteDu} ${this.store.devise()}`;

    const corps =
      retard <= 0
        ? `La facture ${item.facture.numero} d'un montant de ${montant} arrive à échéance le ${item.facture.dateEcheance}. Merci d'avance pour votre règlement.`
        : `La facture ${item.facture.numero} d'un montant de ${montant} présente ${retard} jour(s) de retard. Pourriez-vous me confirmer sa date de règlement ?`;

    return [
      `Bonjour ${contact},`,
      '',
      corps,
      '',
      `Modèle appliqué : « ${item.etape.modele} ».`,
      `${this.store.createur().nom} — ${this.store.createur().pseudo}`,
    ].join('\n');
  }

  envoyer(item: ItemRelance, contenu = ''): { ok: boolean; message?: string } {
    if (this.nbEnvoyeesAujourdhui() >= PLAFOND_ENVOIS_PAR_JOUR) {
      return {
        ok: false,
        message: `Plafond de ${PLAFOND_ENVOIS_PAR_JOUR} relances par jour atteint. Les envois reprennent demain.`,
      };
    }

    const relance: Relance = {
      id: this.store.nouvelId('r'),
      factureId: item.facture.id,
      etapeId: item.etape.id,
      datePlanifiee: item.datePlanifiee,
      dateEnvoi: aujourdhui(),
      statut: 'ENVOYEE',
      contenu: contenu || this.messagePropose(item),
    };

    this.store.relances.update((relances) => [relance, ...relances]);
    this.store.journaliser(
      'RELANCE',
      `Relance « ${item.etape.modele} » envoyée à ${item.facture.marqueNom} pour ${item.facture.numero}`,
    );
    return { ok: true };
  }

  /** Reporte l'étape en enregistrant une relance programmée à une date ultérieure. */
  reporter(item: ItemRelance, jours = 3): void {
    const relance: Relance = {
      id: this.store.nouvelId('r'),
      factureId: item.facture.id,
      etapeId: item.etape.id,
      datePlanifiee: ajouterJours(aujourdhui(), jours),
      dateEnvoi: null,
      statut: 'PROGRAMMEE',
      contenu: '',
    };

    this.store.relances.update((relances) => [relance, ...relances]);
  }

  /** Garde-fou : plus aucune relance dès que la facture est intégralement payée. */
  annulerPour(factureId: string): void {
    this.store.relances.update((relances) =>
      relances.map((relance) =>
        relance.factureId === factureId && relance.statut === 'PROGRAMMEE'
          ? { ...relance, statut: 'ANNULEE' }
          : relance,
      ),
    );
    this.store.journaliser('RELANCE', 'Relances en attente annulées : facture soldée');
  }

  /** Suspend ou réactive les relances pour une marque donnée. */
  basculerSuspension(marqueId: string): void {
    this.store.marques.update((marques) =>
      marques.map((marque) =>
        marque.id === marqueId
          ? { ...marque, relancesSuspendues: !marque.relancesSuspendues }
          : marque,
      ),
    );
  }

  private etapesEnAttente(): ItemRelance[] {
    const relances = this.store.relances();
    const etapesActives = this.etapes().filter((e) => e.active);
    const items: ItemRelance[] = [];

    for (const facture of this.factures.liste()) {
      const eligible =
        facture.resteDu > 0 &&
        facture.statut !== 'BROUILLON' &&
        facture.statut !== 'ANNULEE' &&
        !this.store.marque(facture.marqueId)?.relancesSuspendues;

      if (!eligible) {
        continue;
      }

      const candidates: ItemRelance[] = [];
      for (const etape of etapesActives) {
        const dejaTraitee = relances.some(
          (r) =>
            r.factureId === facture.id &&
            r.etapeId === etape.id &&
            (r.statut === 'ENVOYEE' || r.statut === 'ANNULEE'),
        );
        if (dejaTraitee) {
          continue;
        }

        const reportee = relances.find(
          (r) => r.factureId === facture.id && r.etapeId === etape.id && r.statut === 'PROGRAMMEE',
        );
        const datePlanifiee =
          reportee?.datePlanifiee ?? ajouterJours(facture.dateEcheance, etape.decalageJours);

        candidates.push({
          facture,
          etape,
          datePlanifiee,
          decalageReel: ecartEnJours(facture.dateEcheance, aujourdhui()),
        });
      }

      // Une seule relance par facture à la fois : l'étape la plus avancée dont la date est atteinte.
      const echues = candidates
        .filter((item) => item.datePlanifiee <= aujourdhui())
        .sort((a, b) => b.etape.decalageJours - a.etape.decalageJours);

      if (echues.length) {
        items.push(echues[0]);
        continue;
      }

      const prochaine = candidates
        .filter((item) => item.datePlanifiee > aujourdhui())
        .sort((a, b) => a.datePlanifiee.localeCompare(b.datePlanifiee))[0];

      if (prochaine) {
        items.push(prochaine);
      }
    }

    return items.sort((a, b) => a.datePlanifiee.localeCompare(b.datePlanifiee));
  }
}
