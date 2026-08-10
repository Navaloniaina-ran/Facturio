import { Injectable, computed, inject } from '@angular/core';
import { ajouterJours, aujourdhui, calculerTotaux } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { Campagne, Ligne, StatutCampagne } from '../../core/modeles';
import { QUOTAS } from '../../core/quotas';
import { FactureService, FactureVue } from '../factures/facture.service';
import { PropositionService } from '../propositions/proposition.service';

export interface EtapeAvancement {
  libelle: string;
  fait: boolean;
}

export interface CampagneVue extends Campagne {
  marqueNom: string;
  totalHt: number;
  totalTtc: number;
  nbLivrables: number;
  avancement: EtapeAvancement[];
  /** Pourcentage d'avancement de la chaîne commerciale. */
  progression: number;
  factures: FactureVue[];
}

export interface SaisieCampagne {
  marqueId: string;
  nom: string;
  debut: string;
  fin: string;
  livrables: Ligne[];
}

@Injectable({ providedIn: 'root' })
export class CampagneService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly propositions = inject(PropositionService);

  /** Le module Campagnes est réservé aux offres PRO et BUSINESS. */
  readonly moduleAutorise = computed(() => QUOTAS[this.store.createur().plan].campagnes);

  readonly liste = computed<CampagneVue[]>(() =>
    this.store
      .campagnes()
      .map((campagne) => {
        const totaux = calculerTotaux(campagne.livrables);
        const facturesLiees = this.factures.liste().filter((f) => f.campagneId === campagne.id);
        const factureEmise = facturesLiees.some((f) => f.statut !== 'BROUILLON');
        const paiementRecu = facturesLiees.some((f) => f.montantPaye > 0);

        const avancement: EtapeAvancement[] = [
          { libelle: 'Proposition', fait: campagne.propositionAcceptee },
          { libelle: 'Contrat', fait: campagne.contratSigne },
          { libelle: 'Facture', fait: factureEmise },
          { libelle: 'Paiement', fait: paiementRecu },
        ];

        return {
          ...campagne,
          marqueNom: this.store.nomMarque(campagne.marqueId),
          totalHt: totaux.totalHt,
          totalTtc: totaux.totalTtc,
          nbLivrables: campagne.livrables.reduce((somme, l) => somme + l.quantite, 0),
          avancement,
          progression: Math.round((avancement.filter((e) => e.fait).length / avancement.length) * 100),
          factures: facturesLiees,
        };
      })
      .sort((a, b) => b.debut.localeCompare(a.debut)),
  );

  readonly actives = computed(() => this.liste().filter((c) => c.statut === 'ACTIVE'));

  parId(id: string): CampagneVue | undefined {
    return this.liste().find((c) => c.id === id);
  }

  parMarque(marqueId: string): CampagneVue[] {
    return this.liste().filter((c) => c.marqueId === marqueId);
  }

  creer(saisie: SaisieCampagne): { ok: boolean; message?: string } {
    if (!saisie.marqueId || !saisie.nom.trim()) {
      return { ok: false, message: 'Marque et nom de campagne sont obligatoires.' };
    }
    if (!saisie.livrables.length) {
      return { ok: false, message: 'Ajoutez au moins un livrable.' };
    }

    const campagne: Campagne = {
      id: this.store.nouvelId('c'),
      marqueId: saisie.marqueId,
      nom: saisie.nom,
      debut: saisie.debut,
      fin: saisie.fin,
      statut: 'BROUILLON',
      livrables: saisie.livrables,
      contratNom: null,
      propositionAcceptee: false,
      contratSigne: false,
    };

    this.store.campagnes.update((campagnes) => [campagne, ...campagnes]);
    this.store.journaliser('CAMPAGNE', `Campagne ${campagne.nom} créée`);
    return { ok: true };
  }

  /** Les collaborations sont souvent récurrentes : duplication en un clic. */
  dupliquer(id: string): void {
    const source = this.parId(id);
    if (!source) {
      return;
    }

    this.creer({
      marqueId: source.marqueId,
      nom: `${source.nom} (copie)`,
      debut: aujourdhui(),
      fin: ajouterJours(aujourdhui(), 30),
      livrables: source.livrables.map((l) => ({ ...l, id: this.store.nouvelId('l') })),
    });
  }

  /** Génère la proposition de collaboration depuis les livrables de la campagne. */
  genererProposition(id: string): { ok: boolean; message?: string } {
    const campagne = this.parId(id);
    if (!campagne) {
      return { ok: false, message: 'Campagne introuvable.' };
    }

    const resultat = this.propositions.creer({
      marqueId: campagne.marqueId,
      campagneId: campagne.id,
      date: aujourdhui(),
      dateExpiration: ajouterJours(aujourdhui(), 30),
      conditions: `Livrables de la campagne « ${campagne.nom} ».`,
      lignes: campagne.livrables.map((l) => ({ ...l, id: this.store.nouvelId('l') })),
      brouillon: false,
    });

    if (resultat.ok) {
      this.majStatut(id, 'EN_ATTENTE');
    }
    return resultat;
  }

  /** La facture se génère depuis la campagne, sans ressaisie (P04). */
  genererFacture(id: string): { ok: boolean; facture?: FactureVue; message?: string } {
    const campagne = this.parId(id);
    if (!campagne) {
      return { ok: false, message: 'Campagne introuvable.' };
    }

    const resultat = this.factures.creer({
      marqueId: campagne.marqueId,
      campagneId: campagne.id,
      propositionId: null,
      dateEmission: aujourdhui(),
      dateEcheance: this.factures.echeanceParDefaut(campagne.marqueId),
      acomptePourcent: 0,
      conditions: `Campagne « ${campagne.nom} » du ${campagne.debut} au ${campagne.fin}.`,
      lignes: campagne.livrables.map((l) => ({ ...l, id: this.store.nouvelId('l') })),
      brouillon: false,
    });

    if (!resultat.ok) {
      return { ok: false, message: resultat.blocage?.message };
    }

    this.majStatut(id, 'ACTIVE');
    return { ok: true, facture: resultat.facture };
  }

  joindreContrat(id: string, nomFichier: string): void {
    this.store.campagnes.update((campagnes) =>
      campagnes.map((campagne) =>
        campagne.id === id ? { ...campagne, contratNom: nomFichier, contratSigne: true } : campagne,
      ),
    );
    this.store.journaliser('CAMPAGNE', `Contrat joint à ${this.parId(id)?.nom}`);
  }

  /** Clôture possible uniquement si toutes les factures liées sont payées ou annulées. */
  cloturer(id: string): { ok: boolean; message?: string } {
    const campagne = this.parId(id);
    if (!campagne) {
      return { ok: false, message: 'Campagne introuvable.' };
    }

    const enCours = campagne.factures.filter(
      (f) => f.statut !== 'PAYEE' && f.statut !== 'ANNULEE',
    );
    if (enCours.length) {
      return {
        ok: false,
        message: `Clôture impossible : ${enCours.length} facture(s) liée(s) ne sont ni payées ni annulées.`,
      };
    }

    this.majStatut(id, 'TERMINEE');
    this.store.journaliser('CAMPAGNE', `Campagne ${campagne.nom} clôturée`);
    return { ok: true };
  }

  private majStatut(id: string, statut: StatutCampagne): void {
    this.store.campagnes.update((campagnes) =>
      campagnes.map((campagne) => (campagne.id === id ? { ...campagne, statut } : campagne)),
    );
  }
}
