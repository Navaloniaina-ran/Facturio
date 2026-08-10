import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { EspaceStoreService } from '../../core/espace-store.service';
import { libelle } from '../../core/libelles';
import { FactureService } from '../../pages/factures/facture.service';
import { RelanceService } from '../../pages/relances/relance.service';

export interface EntreeNavigation {
  lien: string;
  libelle: string;
  icone: string;
  compteur?: () => number;
}

/** Icônes en 24×24, tracées à la main pour éviter toute dépendance externe. */
const ICONES = {
  tableau: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
  marques: 'M12 3l2.6 5.6 6.1.8-4.5 4.3 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z',
  campagnes: 'M4 10v4l10 4V6zm12-2h4v8h-4z',
  propositions: 'M6 2h8l4 4v16H6zm2 8h8v2H8zm0 4h8v2H8z',
  factures: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zm3 5h8v2H8zm0 4h8v2H8z',
  paiements: 'M2 6h20v4H2zm0 6h20v6H2zm2 2h6v2H4z',
  relances: 'M12 2a6 6 0 0 0-6 6v5l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-3 18h6a3 3 0 0 1-6 0z',
  rapports: 'M4 20h4V10H4zm6 0h4V4h-4zm6 0h4v-7h-4z',
} as const;

/**
 * Coquille de l'espace Créateur : navigation, en-tête et zone de contenu.
 * Au chargement, le recalcul quotidien des échéances est appliqué (P08) ;
 * en production, cette tâche est planifiée côté backend.
 */
@Component({
  selector: 'app-espace-createur',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './espace-createur.component.html',
})
export class EspaceCreateurComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly store = inject(EspaceStoreService);
  private readonly factures = inject(FactureService);
  private readonly relances = inject(RelanceService);

  protected readonly menuMobileOuvert = signal(false);
  protected readonly createur = this.store.createur.asReadonly();

  protected readonly navigation: EntreeNavigation[] = [
    { lien: 'tableau-de-bord', libelle: 'Tableau de bord', icone: ICONES.tableau },
    { lien: 'marques', libelle: libelle('clients'), icone: ICONES.marques },
    { lien: 'campagnes', libelle: libelle('projects'), icone: ICONES.campagnes },
    { lien: 'propositions', libelle: libelle('quotes'), icone: ICONES.propositions },
    {
      lien: 'factures',
      libelle: libelle('invoices'),
      icone: ICONES.factures,
      compteur: () => this.factures.enRetard().length,
    },
    { lien: 'paiements', libelle: 'Paiements', icone: ICONES.paiements },
    {
      lien: 'relances',
      libelle: libelle('reminders'),
      icone: ICONES.relances,
      compteur: () => this.relances.fileAttente().length,
    },
    { lien: 'rapports', libelle: 'Rapports', icone: ICONES.rapports },
  ];

  protected readonly initiales = computed(() =>
    this.createur()
      .nom.split(' ')
      .map((mot) => mot.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  protected readonly periode = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date()),
  );

  protected readonly nbNotifications = computed(
    () => this.factures.enRetard().length + this.relances.fileAttente().length,
  );

  protected readonly tachesRestantes = computed(
    () => this.store.onboarding().filter((tache) => !tache.fait).length,
  );

  constructor() {
    this.factures.recalculerStatuts();
  }

  protected basculerMenu(): void {
    this.menuMobileOuvert.update((ouvert) => !ouvert);
  }

  protected fermerMenu(): void {
    this.menuMobileOuvert.set(false);
  }

  protected deconnexion(): void {
    this.auth.deconnexion();
    void this.router.navigate(['/createurs/connexion']);
  }
}
