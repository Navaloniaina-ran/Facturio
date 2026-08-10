import { Injectable, computed, inject } from '@angular/core';
import { aujourdhui, calculerTotaux } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { Ligne, Proposition, StatutProposition } from '../../core/modeles';
import { FactureService, FactureVue } from '../factures/facture.service';

export interface PropositionVue extends Proposition {
  marqueNom: string;
  campagneNom: string | null;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
}

export interface SaisieProposition {
  marqueId: string;
  campagneId: string | null;
  date: string;
  dateExpiration: string;
  conditions: string;
  lignes: Ligne[];
  brouillon: boolean;
}

@Injectable({ providedIn: 'root' })
export class PropositionService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);

  readonly liste = computed<PropositionVue[]>(() =>
    this.store
      .propositions()
      .map((proposition) => {
        const totaux = calculerTotaux(proposition.lignes);
        return {
          ...proposition,
          statut: this.statutAffiche(proposition),
          marqueNom: this.store.nomMarque(proposition.marqueId),
          campagneNom: this.store.campagne(proposition.campagneId)?.nom ?? null,
          totalHt: totaux.totalHt,
          totalTva: totaux.totalTva,
          totalTtc: totaux.totalTtc,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  /** Taux d'acceptation des propositions, pour les rapports. */
  readonly tauxAcceptation = computed(() => {
    const decidees = this.liste().filter(
      (p) => p.statut === 'ACCEPTEE' || p.statut === 'REFUSEE' || p.statut === 'FACTUREE',
    );
    if (!decidees.length) {
      return 0;
    }
    const acceptees = decidees.filter((p) => p.statut !== 'REFUSEE').length;
    return Math.round((acceptees / decidees.length) * 100);
  });

  parId(id: string): PropositionVue | undefined {
    return this.liste().find((p) => p.id === id);
  }

  parMarque(marqueId: string): PropositionVue[] {
    return this.liste().filter((p) => p.marqueId === marqueId);
  }

  creer(saisie: SaisieProposition): { ok: boolean; proposition?: PropositionVue; message?: string } {
    if (!saisie.marqueId) {
      return { ok: false, message: 'Sélectionnez une marque.' };
    }
    if (!saisie.lignes.length) {
      return { ok: false, message: 'Ajoutez au moins un livrable.' };
    }

    const proposition: Proposition = {
      id: this.store.nouvelId('q'),
      numero: saisie.brouillon ? '' : this.store.prochainNumero('PRO'),
      marqueId: saisie.marqueId,
      campagneId: saisie.campagneId,
      date: saisie.date,
      dateExpiration: saisie.dateExpiration,
      statut: saisie.brouillon ? 'BROUILLON' : 'ENVOYEE',
      lignes: saisie.lignes,
      conditions: saisie.conditions,
      factureId: null,
    };

    this.store.propositions.update((liste) => [proposition, ...liste]);
    this.store.journaliser(
      'PROPOSITION',
      `Proposition ${proposition.numero || '(brouillon)'} pour ${this.store.nomMarque(proposition.marqueId)}`,
    );

    return { ok: true, proposition: this.parId(proposition.id) };
  }

  envoyer(id: string): void {
    this.store.propositions.update((liste) =>
      liste.map((proposition) =>
        proposition.id === id
          ? {
              ...proposition,
              numero: proposition.numero || this.store.prochainNumero('PRO'),
              statut: 'ENVOYEE' as StatutProposition,
            }
          : proposition,
      ),
    );
    this.store.journaliser('PROPOSITION', `Proposition ${this.parId(id)?.numero} envoyée`);
  }

  marquer(id: string, statut: Extract<StatutProposition, 'ACCEPTEE' | 'REFUSEE'>): void {
    this.majStatut(id, statut);

    const proposition = this.parId(id);
    if (statut === 'ACCEPTEE' && proposition?.campagneId) {
      this.store.campagnes.update((campagnes) =>
        campagnes.map((campagne) =>
          campagne.id === proposition.campagneId
            ? { ...campagne, propositionAcceptee: true, statut: 'ACTIVE' }
            : campagne,
        ),
      );
    }

    this.store.journaliser(
      'PROPOSITION',
      `Proposition ${proposition?.numero} marquée ${statut === 'ACCEPTEE' ? 'acceptée' : 'refusée'}`,
    );
  }

  /**
   * P06 — Transformation en un clic : report intégral des lignes, des taux
   * de TVA, des remises et des conditions. Le lien de traçabilité est conservé
   * et la proposition devient verrouillée.
   */
  transformerEnFacture(id: string): { ok: boolean; facture?: FactureVue; message?: string } {
    const proposition = this.parId(id);
    if (!proposition) {
      return { ok: false, message: 'Proposition introuvable.' };
    }
    if (proposition.statut !== 'ACCEPTEE') {
      return { ok: false, message: 'Seule une proposition acceptée peut être transformée en facture.' };
    }

    const resultat = this.factures.creer({
      marqueId: proposition.marqueId,
      campagneId: proposition.campagneId,
      propositionId: proposition.id,
      dateEmission: aujourdhui(),
      dateEcheance: this.factures.echeanceParDefaut(proposition.marqueId),
      acomptePourcent: 0,
      conditions: proposition.conditions,
      lignes: proposition.lignes.map((ligne) => ({ ...ligne })),
      brouillon: false,
    });

    if (!resultat.ok || !resultat.facture) {
      return { ok: false, message: resultat.blocage?.message };
    }

    this.store.propositions.update((liste) =>
      liste.map((p) =>
        p.id === id ? { ...p, statut: 'FACTUREE' as StatutProposition, factureId: resultat.facture!.id } : p,
      ),
    );
    this.store.journaliser(
      'FACTURE',
      `Proposition ${proposition.numero} transformée en facture ${resultat.facture.numero}`,
    );

    return { ok: true, facture: resultat.facture };
  }

  dupliquer(id: string): void {
    const source = this.parId(id);
    if (!source) {
      return;
    }

    this.creer({
      marqueId: source.marqueId,
      campagneId: source.campagneId,
      date: aujourdhui(),
      dateExpiration: source.dateExpiration,
      conditions: source.conditions,
      lignes: source.lignes.map((ligne) => ({ ...ligne, id: this.store.nouvelId('l') })),
      brouillon: true,
    });
  }

  /** Suppression réservée aux brouillons. */
  supprimer(id: string): { ok: boolean; message?: string } {
    if (this.parId(id)?.statut !== 'BROUILLON') {
      return { ok: false, message: 'Seul un brouillon peut être supprimé.' };
    }

    this.store.propositions.update((liste) => liste.filter((p) => p.id !== id));
    return { ok: true };
  }

  /** Passage automatique à Expiré à la date d'expiration. */
  private statutAffiche(proposition: Proposition): StatutProposition {
    if (proposition.statut === 'ENVOYEE' && proposition.dateExpiration < aujourdhui()) {
      return 'EXPIREE';
    }
    return proposition.statut;
  }

  private majStatut(id: string, statut: StatutProposition): void {
    this.store.propositions.update((liste) =>
      liste.map((proposition) => (proposition.id === id ? { ...proposition, statut } : proposition)),
    );
  }
}
