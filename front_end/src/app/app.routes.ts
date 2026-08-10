import { Routes } from '@angular/router';
import { authGuard, visiteurGuard } from './core/auth.guard';

/**
 * Plan de routes du FRONT 1 (chapitre 20.2 du cahier des charges).
 * Le portail entreprise pointe volontairement sur le même écran de connexion :
 * un créateur authentifié y est redirigé en silence vers son espace.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'createurs/connexion' },

  {
    path: 'createurs/connexion',
    canActivate: [visiteurGuard],
    loadComponent: () => import('./pages/connexion/connexion.component').then((m) => m.ConnexionComponent),
  },
  {
    path: 'createurs/inscription',
    canActivate: [visiteurGuard],
    loadComponent: () =>
      import('./pages/inscription/inscription.component').then((m) => m.InscriptionComponent),
  },
  {
    path: 'entreprises/connexion',
    canActivate: [visiteurGuard],
    data: { portailEntreprise: true },
    loadComponent: () => import('./pages/connexion/connexion.component').then((m) => m.ConnexionComponent),
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/espace-createur/espace-createur.component').then(
        (m) => m.EspaceCreateurComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord',
        loadComponent: () =>
          import('./pages/tableau-de-bord/tableau-de-bord.component').then(
            (m) => m.TableauDeBordComponent,
          ),
      },
      {
        path: 'marques',
        title: 'Marques',
        loadComponent: () => import('./pages/marques/marques.component').then((m) => m.MarquesComponent),
      },
      {
        path: 'campagnes',
        title: 'Campagnes',
        loadComponent: () =>
          import('./pages/campagnes/campagnes.component').then((m) => m.CampagnesComponent),
      },
      {
        path: 'propositions',
        title: 'Propositions',
        loadComponent: () =>
          import('./pages/propositions/propositions.component').then((m) => m.PropositionsComponent),
      },
      {
        path: 'factures',
        title: 'Factures',
        loadComponent: () =>
          import('./pages/factures/factures.component').then((m) => m.FacturesComponent),
      },
      {
        path: 'paiements',
        title: 'Paiements',
        loadComponent: () =>
          import('./pages/paiements/paiements.component').then((m) => m.PaiementsComponent),
      },
      {
        path: 'relances',
        title: 'Relances',
        loadComponent: () =>
          import('./pages/relances/relances.component').then((m) => m.RelancesComponent),
      },
      {
        path: 'rapports',
        title: 'Rapports',
        loadComponent: () =>
          import('./pages/rapports/rapports.component').then((m) => m.RapportsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
