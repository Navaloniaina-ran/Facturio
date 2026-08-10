import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspaceStoreService } from '../../core/espace-store.service';
import { BadgeStatutComponent } from '../../shared/badge-statut/badge-statut.component';
import { ModaleComponent } from '../../shared/modale/modale.component';
import { MontantPipe } from '../../shared/montant.pipe';
import { CampagneService } from '../campagnes/campagne.service';
import { FactureService } from '../factures/facture.service';
import { MARQUE_VIDE, MarqueService, MarqueVue, SaisieMarque } from './marque.service';

@Component({
  selector: 'app-marques',
  imports: [FormsModule, DatePipe, MontantPipe, ModaleComponent, BadgeStatutComponent],
  templateUrl: './marques.component.html',
})
export class MarquesComponent {
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly campagnes = inject(CampagneService);
  protected readonly service = inject(MarqueService);

  protected readonly devise = this.store.devise;
  protected readonly recherche = signal('');
  protected readonly seulementMauvaisPayeurs = signal(false);
  protected readonly modale = signal<'formulaire' | 'fiche' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected marqueSelectionnee = signal<MarqueVue | null>(null);
  protected idEnEdition: string | null = null;
  protected formulaire: SaisieMarque = { ...MARQUE_VIDE };

  protected readonly listeFiltree = computed(() => {
    const terme = this.recherche().trim().toLowerCase();

    return this.service
      .liste()
      .filter((marque) => !this.seulementMauvaisPayeurs() || marque.mauvaisPayeur)
      .filter(
        (marque) =>
          !terme ||
          marque.nom.toLowerCase().includes(terme) ||
          marque.contact.toLowerCase().includes(terme) ||
          marque.email.toLowerCase().includes(terme),
      );
  });

  protected ouvrirCreation(): void {
    this.idEnEdition = null;
    this.formulaire = { ...MARQUE_VIDE };
    this.erreur.set(null);
    this.modale.set('formulaire');
  }

  protected ouvrirEdition(marque: MarqueVue): void {
    this.idEnEdition = marque.id;
    this.formulaire = {
      nom: marque.nom,
      contact: marque.contact,
      email: marque.email,
      telephone: marque.telephone,
      adresse: marque.adresse,
      conditionsPaiementJours: marque.conditionsPaiementJours,
      tauxTvaDefaut: marque.tauxTvaDefaut,
      notes: marque.notes,
    };
    this.erreur.set(null);
    this.modale.set('formulaire');
  }

  protected ouvrirFiche(marque: MarqueVue): void {
    this.marqueSelectionnee.set(marque);
    this.modale.set('fiche');
  }

  protected fermer(): void {
    this.modale.set(null);
  }

  protected enregistrer(): void {
    const resultat = this.idEnEdition
      ? this.service.modifier(this.idEnEdition, this.formulaire)
      : this.service.creer(this.formulaire);

    if (!resultat.ok) {
      this.erreur.set(resultat.message ?? resultat.blocage?.message ?? 'Enregistrement impossible.');
      return;
    }

    this.message.set(this.idEnEdition ? 'Marque mise à jour.' : 'Marque ajoutée.');
    this.fermer();
  }

  protected supprimer(marque: MarqueVue): void {
    const resultat = this.service.supprimer(marque.id);
    if (!resultat.ok) {
      this.message.set(resultat.message ?? null);
      return;
    }
    this.message.set(`${marque.nom} supprimée.`);
  }

  protected basculerSuspension(marque: MarqueVue): void {
    this.store.marques.update((marques) =>
      marques.map((m) => (m.id === marque.id ? { ...m, relancesSuspendues: !m.relancesSuspendues } : m)),
    );
  }

  /** Factures de la marque affichée dans la fiche. */
  protected facturesDe(marqueId: string) {
    return this.factures.parMarque(marqueId);
  }

  protected campagnesDe(marqueId: string) {
    return this.campagnes.parMarque(marqueId);
  }

  protected exporter(): void {
    const contenu = this.service.versCsv();
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    lien.download = 'marques.csv';
    lien.click();
    URL.revokeObjectURL(lien.href);
    this.message.set('Export CSV généré.');
  }
}
