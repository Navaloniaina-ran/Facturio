import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ajouterJours, aujourdhui, calculerTotaux } from '../../core/calculs';
import { EspaceStoreService } from '../../core/espace-store.service';
import { LIBELLES_LIVRABLE, LIBELLES_METHODE } from '../../core/libelles';
import { Ligne, MethodePaiement, StatutFacture, TypeLivrable } from '../../core/modeles';
import { BadgeStatutComponent } from '../../shared/badge-statut/badge-statut.component';
import { ModaleComponent } from '../../shared/modale/modale.component';
import { MontantPipe } from '../../shared/montant.pipe';
import { CampagneService } from '../campagnes/campagne.service';
import { PaiementService } from '../paiements/paiement.service';
import { RelanceService } from '../relances/relance.service';
import { FactureService, FactureVue } from './facture.service';

type Onglet = 'TOUTES' | StatutFacture;

/** Module le plus critique de l'application (P01, P06, P07, P08). */
@Component({
  selector: 'app-factures',
  imports: [FormsModule, DatePipe, RouterLink, MontantPipe, ModaleComponent, BadgeStatutComponent],
  templateUrl: './factures.component.html',
})
export class FacturesComponent {
  private readonly store = inject(EspaceStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly paiements = inject(PaiementService);
  private readonly relances = inject(RelanceService);
  protected readonly campagnes = inject(CampagneService);
  protected readonly service = inject(FactureService);

  protected readonly devise = this.store.devise;
  protected readonly marques = this.store.marques.asReadonly();
  protected readonly typesLivrable = Object.entries(LIBELLES_LIVRABLE) as [TypeLivrable, string][];
  protected readonly methodes = Object.entries(LIBELLES_METHODE) as [MethodePaiement, string][];

  protected readonly onglets: { cle: Onglet; libelle: string }[] = [
    { cle: 'TOUTES', libelle: 'Toutes' },
    { cle: 'BROUILLON', libelle: 'Brouillons' },
    { cle: 'ENVOYEE', libelle: 'Envoyées' },
    { cle: 'PARTIELLEMENT_PAYEE', libelle: 'Partiellement payées' },
    { cle: 'PAYEE', libelle: 'Payées' },
    { cle: 'EN_RETARD', libelle: 'En retard' },
    { cle: 'ANNULEE', libelle: 'Annulées' },
  ];

  protected readonly onglet = signal<Onglet>(
    (this.route.snapshot.queryParamMap.get('statut') as Onglet | null) ?? 'TOUTES',
  );
  protected readonly recherche = signal('');
  protected readonly modale = signal<'creation' | 'detail' | 'paiement' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly factureCourante = signal<FactureVue | null>(null);

  // Formulaire de création
  protected saisie = {
    marqueId: '',
    campagneId: '',
    dateEmission: aujourdhui(),
    dateEcheance: ajouterJours(aujourdhui(), 30),
    acomptePourcent: 0,
    conditions: 'Paiement par virement bancaire.',
  };
  protected lignes: Ligne[] = [];

  // Formulaire de paiement
  protected saisiePaiement = {
    montant: 0,
    date: aujourdhui(),
    methode: 'VIREMENT' as MethodePaiement,
    reference: '',
    note: '',
  };

  protected readonly listeFiltree = computed(() => {
    const onglet = this.onglet();
    const terme = this.recherche().trim().toLowerCase();

    return this.service
      .liste()
      .filter((facture) => onglet === 'TOUTES' || facture.statut === onglet)
      .filter(
        (facture) =>
          !terme ||
          facture.numero.toLowerCase().includes(terme) ||
          facture.marqueNom.toLowerCase().includes(terme) ||
          String(facture.totalTtc).includes(terme),
      );
  });

  protected nbParOnglet(cle: Onglet): number {
    return cle === 'TOUTES'
      ? this.service.liste().length
      : this.service.liste().filter((facture) => facture.statut === cle).length;
  }

  // ---------- Création ----------

  protected ouvrirCreation(): void {
    this.saisie = {
      marqueId: this.marques()[0]?.id ?? '',
      campagneId: '',
      dateEmission: aujourdhui(),
      dateEcheance: this.service.echeanceParDefaut(this.marques()[0]?.id ?? ''),
      acomptePourcent: 0,
      conditions: 'Paiement par virement bancaire.',
    };
    this.lignes = [this.nouvelleLigne()];
    this.erreur.set(null);
    this.modale.set('creation');
  }

  protected nouvelleLigne(): Ligne {
    const tauxTva = this.store.marque(this.saisie.marqueId)?.tauxTvaDefaut ?? 20;
    return {
      id: this.store.nouvelId('l'),
      description: '',
      typeLivrable: 'POST',
      quantite: 1,
      prixUnitaire: 0,
      remisePourcent: 0,
      tauxTva,
    };
  }

  protected ajouterLigne(): void {
    this.lignes = [...this.lignes, this.nouvelleLigne()];
  }

  protected retirerLigne(id: string): void {
    this.lignes = this.lignes.filter((ligne) => ligne.id !== id);
  }

  /** Recalculé à chaque frappe : total HT, TVA ventilée et TTC. */
  protected totaux() {
    return calculerTotaux(this.lignes);
  }

  protected majEcheance(): void {
    this.saisie.dateEcheance = this.service.echeanceParDefaut(
      this.saisie.marqueId,
      this.saisie.dateEmission,
    );
  }

  protected enregistrer(brouillon: boolean): void {
    if (!this.saisie.marqueId) {
      this.erreur.set('Sélectionnez une marque.');
      return;
    }
    if (!this.lignes.length || this.lignes.some((ligne) => !ligne.description.trim())) {
      this.erreur.set('Chaque livrable doit porter une description.');
      return;
    }

    const resultat = this.service.creer({
      marqueId: this.saisie.marqueId,
      campagneId: this.saisie.campagneId || null,
      propositionId: null,
      dateEmission: this.saisie.dateEmission,
      dateEcheance: this.saisie.dateEcheance,
      acomptePourcent: Number(this.saisie.acomptePourcent),
      conditions: this.saisie.conditions,
      lignes: this.lignes,
      brouillon,
    });

    if (!resultat.ok) {
      this.erreur.set(resultat.blocage?.message ?? 'Création impossible.');
      return;
    }

    this.message.set(
      brouillon
        ? 'Brouillon enregistré : le numéro sera attribué à la validation.'
        : `Facture ${resultat.facture?.numero} émise et PDF généré.`,
    );
    this.modale.set(null);
  }

  // ---------- Actions unitaires ----------

  protected ouvrirDetail(facture: FactureVue): void {
    this.factureCourante.set(facture);
    this.modale.set('detail');
  }

  protected ouvrirPaiement(facture: FactureVue): void {
    this.factureCourante.set(facture);
    this.saisiePaiement = {
      montant: facture.resteDu,
      date: aujourdhui(),
      methode: 'VIREMENT',
      reference: '',
      note: '',
    };
    this.erreur.set(null);
    this.modale.set('paiement');
  }

  protected enregistrerPaiement(): void {
    const facture = this.factureCourante();
    if (!facture) {
      return;
    }

    const resultat = this.paiements.enregistrer({
      factureId: facture.id,
      montant: Number(this.saisiePaiement.montant),
      date: this.saisiePaiement.date,
      methode: this.saisiePaiement.methode,
      reference: this.saisiePaiement.reference,
      note: this.saisiePaiement.note,
    });

    if (!resultat.ok) {
      this.erreur.set(resultat.message ?? 'Paiement refusé.');
      return;
    }

    this.message.set(
      resultat.facturePayee
        ? 'Paiement enregistré : facture soldée, relances en attente annulées.'
        : 'Paiement partiel enregistré, reste dû recalculé.',
    );
    this.modale.set(null);
  }

  protected envoyer(facture: FactureVue): void {
    this.service.envoyer(facture.id);
    this.message.set('Facture envoyée par email, échéance sous surveillance.');
  }

  protected dupliquer(facture: FactureVue): void {
    this.service.dupliquer(facture.id);
    this.message.set('Facture dupliquée en brouillon.');
  }

  protected annuler(facture: FactureVue): void {
    this.service.annuler(facture.id);
    this.message.set(`Facture ${facture.numero} annulée.`);
  }

  protected genererAvoir(facture: FactureVue): void {
    const resultat = this.service.genererAvoir(facture.id);
    this.message.set(
      resultat.ok
        ? `Avoir ${resultat.facture?.numero} généré sur la facture ${facture.numero}.`
        : 'Avoir impossible.',
    );
  }

  protected paiementsDe(factureId: string) {
    return this.paiements.parFacture(factureId);
  }

  protected relancesDe(factureId: string) {
    return this.relances.historiqueFacture(factureId);
  }

  protected fermer(): void {
    this.modale.set(null);
    this.erreur.set(null);
  }
}
