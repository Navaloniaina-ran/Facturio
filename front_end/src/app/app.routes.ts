import { Route, Routes } from '@angular/router';
import {
  authGuard,
  businessGuard,
  creatorGuard,
  guestGuard,
  workspaceHomeGuard,
} from './core/auth.guard';

/**
 * Plan de routes. Les URL restent celles du produit, en français ; seuls les
 * fichiers et le code sont en anglais.
 *
 * Deux arborescences distinctes, `/createur/**` et `/entreprise/**`, chacune
 * fermée par une garde posée sur sa route parente. L'autorisation n'est donc
 * écrite qu'une fois par espace, et tout écran ajouté sous une racine en
 * hérite — impossible d'oublier un `canActivate` sur un enfant.
 */

type CanActivate = NonNullable<Route['canActivate']>[number];

/**
 * Écrans communs aux deux espaces. Ils sont décrits une seule fois et montés
 * sous les deux racines : le vocabulaire de l'interface s'adapte au profil
 * (voir `I18nService.vocab`), la mécanique est la même.
 */
function sharedChildren(): Routes {
  return [
    {
      path: 'tableau-de-bord',
      title: 'Tableau de bord',
      loadComponent: () =>
        import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    },
    {
      path: 'propositions',
      title: 'Propositions',
      loadComponent: () => import('./pages/quotes/quotes.component').then((m) => m.QuotesComponent),
    },
    {
      path: 'factures',
      title: 'Factures',
      loadComponent: () =>
        import('./pages/invoices/invoices.component').then((m) => m.InvoicesComponent),
    },
    {
      path: 'paiements',
      title: 'Paiements',
      loadComponent: () =>
        import('./pages/payments/payments.component').then((m) => m.PaymentsComponent),
    },
    {
      path: 'relances',
      title: 'Relances',
      loadComponent: () =>
        import('./pages/reminders/reminders.component').then((m) => m.RemindersComponent),
    },
    {
      path: 'modeles',
      title: 'Modèles de facture',
      loadComponent: () =>
        import('./pages/invoice-templates/invoice-templates.component').then(
          (m) => m.InvoiceTemplatesComponent,
        ),
    },
    {
      path: 'modeles/:id/edition',
      title: 'Éditeur de modèle',
      loadComponent: () =>
        import('./pages/invoice-templates/invoice-template-editor.component').then(
          (m) => m.InvoiceTemplateEditorComponent,
        ),
    },
    {
      path: 'rapports',
      title: 'Rapports',
      loadComponent: () =>
        import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
    },
    {
      path: 'parametres',
      title: 'Paramètres',
      loadComponent: () =>
        import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
    },
    {
      path: 'abonnement',
      title: 'Abonnement',
      loadComponent: () =>
        import('./pages/subscription/subscription.component').then((m) => m.SubscriptionComponent),
    },
  ];
}

/** Écrans propres au créateur : marques, campagnes, collaborations. */
function creatorChildren(): Routes {
  return [
    {
      path: 'marques',
      title: 'Marques',
      loadComponent: () => import('./pages/brands/brands.component').then((m) => m.BrandsComponent),
    },
    {
      path: 'campagnes',
      title: 'Campagnes',
      loadComponent: () =>
        import('./pages/campaigns/campaigns.component').then((m) => m.CampaignsComponent),
    },
    {
      path: 'collaborations',
      title: 'Collaborations',
      loadComponent: () =>
        import('./pages/collaborations/collaborations.component').then(
          (m) => m.CollaborationsComponent,
        ),
    },
  ];
}

/** Écrans propres à la PME : son fichier clients et son fichier fournisseurs. */
function businessChildren(): Routes {
  return [
    {
      path: 'clients',
      title: 'Clients',
      loadComponent: () =>
        import('./pages/pme/pme-customers.component').then((m) => m.PmeCustomersComponent),
    },
    {
      path: 'fournisseurs',
      title: 'Fournisseurs',
      loadComponent: () =>
        import('./pages/pme/pme-suppliers.component').then((m) => m.PmeSuppliersComponent),
    },
  ];
}

/**
 * Monte un espace : la coquille est commune aux deux, sa navigation s'adapte
 * déjà au type de session. Les gardes sont posées ici, sur le parent.
 */
function workspaceShell(path: string, guard: CanActivate, own: Routes): Route {
  return {
    path,
    canActivate: [authGuard, guard],
    loadComponent: () =>
      import('./layout/creator-shell/creator-shell.component').then((m) => m.CreatorShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      ...own,
      ...sharedChildren(),
    ],
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'createurs/connexion' },

  {
    path: 'createurs/connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'createurs/inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'entreprises/connexion',
    canActivate: [guestGuard],
    data: { businessPortal: true },
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  workspaceShell('createur', creatorGuard, creatorChildren()),
  workspaceShell('entreprise', businessGuard, businessChildren()),

  // Ancienne racine unique : on aiguille vers l'espace de la session plutôt
  // que de renvoyer une page introuvable à un favori encore en circulation.
  { path: 'app', canActivate: [authGuard, workspaceHomeGuard], children: [] },
  { path: 'app/**', canActivate: [authGuard, workspaceHomeGuard], children: [] },

  { path: '**', redirectTo: '' },
];
