import { Injectable, computed, inject } from '@angular/core';
import { arrondi, delaiMoyenPaiement } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { Marque } from '../../core/modeles';
import { Blocage, verifierLimite } from '../../core/quotas';
import { FactureService } from '../factures/facture.service';

export interface MarqueVue extends Marque {
  nbFactures: number;
  totalFacture: number;
  totalPaye: number;
  resteDu: number;
  delaiMoyenPaiement: number;
  derniereActivite: string | null;
  /** Au moins une facture en retard : filtre « mauvais payeurs ». */
  mauvaisPayeur: boolean;
}

export type SaisieMarque = Omit<Marque, 'id' | 'relancesSuspendues'>;

export const MARQUE_VIDE: SaisieMarque = {
  nom: '',
  contact: '',
  email: '',
  telephone: '',
  adresse: '',
  conditionsPaiementJours: 30,
  tauxTvaDefaut: 20,
  notes: '',
};

@Injectable({ providedIn: 'root' })
export class MarqueService {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);

  readonly liste = computed<MarqueVue[]>(() => {
    const paiements = this.store.paiements();

    return this.store.marques().map((marque) => {
      const facturesMarque = this.factures.liste().filter((f) => f.marqueId === marque.id);
      const brutes = this.store.factures().filter((f) => f.marqueId === marque.id);

      return {
        ...marque,
        nbFactures: facturesMarque.length,
        totalFacture: arrondi(facturesMarque.reduce((somme, f) => somme + f.totalTtc, 0)),
        totalPaye: arrondi(facturesMarque.reduce((somme, f) => somme + f.montantPaye, 0)),
        resteDu: arrondi(
          facturesMarque
            .filter((f) => f.statut !== 'ANNULEE' && f.statut !== 'BROUILLON')
            .reduce((somme, f) => somme + f.resteDu, 0),
        ),
        delaiMoyenPaiement: delaiMoyenPaiement(brutes, paiements),
        derniereActivite: facturesMarque.map((f) => f.dateEmission).sort().at(-1) ?? null,
        mauvaisPayeur: facturesMarque.some((f) => f.statut === 'EN_RETARD'),
      };
    });
  });

  readonly nbMauvaisPayeurs = computed(() => this.liste().filter((m) => m.mauvaisPayeur).length);

  parId(id: string): MarqueVue | undefined {
    return this.liste().find((m) => m.id === id);
  }

  creer(saisie: SaisieMarque): { ok: boolean; blocage?: Blocage; message?: string } {
    if (!saisie.nom.trim()) {
      return { ok: false, message: 'Le nom de la marque est obligatoire.' };
    }
    if (saisie.email && !saisie.email.includes('@')) {
      return { ok: false, message: 'Adresse email invalide.' };
    }

    const blocage = verifierLimite(
      this.store.createur().plan,
      'marques',
      this.store.marques().length,
      'marques',
    );
    if (blocage) {
      return { ok: false, blocage };
    }

    const marque: Marque = { ...saisie, id: this.store.nouvelId('m'), relancesSuspendues: false };
    this.store.marques.update((marques) => [...marques, marque]);
    this.store.journaliser('MARQUE', `Marque ${marque.nom} ajoutée`);

    return { ok: true };
  }

  modifier(id: string, saisie: SaisieMarque): { ok: boolean; message?: string } {
    if (!saisie.nom.trim()) {
      return { ok: false, message: 'Le nom de la marque est obligatoire.' };
    }

    this.store.marques.update((marques) =>
      marques.map((marque) => (marque.id === id ? { ...marque, ...saisie } : marque)),
    );
    return { ok: true };
  }

  /** Une marque rattachée à une facture n'est jamais supprimée. */
  supprimer(id: string): { ok: boolean; message?: string } {
    if (this.store.factures().some((f) => f.marqueId === id)) {
      return { ok: false, message: 'Cette marque porte des factures : elle ne peut pas être supprimée.' };
    }

    this.store.marques.update((marques) => marques.filter((m) => m.id !== id));
    return { ok: true };
  }

  /** Export CSV du portefeuille de marques. */
  versCsv(): string {
    const entetes = ['Nom', 'Contact', 'Email', 'Telephone', 'Factures', 'Total facture', 'Reste du'];
    const lignes = this.liste().map((m) =>
      [m.nom, m.contact, m.email, m.telephone, m.nbFactures, m.totalFacture, m.resteDu]
        .map((valeur) => `"${String(valeur).replace(/"/g, '""')}"`)
        .join(';'),
    );

    return [entetes.join(';'), ...lignes].join('\n');
  }
}
