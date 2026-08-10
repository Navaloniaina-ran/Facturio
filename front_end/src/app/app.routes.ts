import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

/**
 * Plan de routes du FRONT 1 (chapitre 20.2 du cahier des charges).
 * Les URL restent celles du produit, en français ; seuls les fichiers et le
 * code sont en anglais.
 * Le portail entreprise pointe volontairement sur le même écran de connexion :
 * un créateur authentifié y est redirigé en silence vers son espace.
 */
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

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/creator-shell/creator-shell.component').then((m) => m.CreatorShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
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
        path: 'parametres',
        title: 'Paramètres',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'abonnement',
        title: 'Abonnement',
        loadComponent: () =>
          import('./pages/subscription/subscription.component').then(
            (m) => m.SubscriptionComponent,
          ),
      },
      {
        path: 'rapports',
        title: 'Rapports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
