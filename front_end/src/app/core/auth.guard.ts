import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { WorkspaceType } from './models';
import { workspaceHome } from './workspace-routes';

/** Protège les deux espaces : sans session, retour au portail créateur. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn() ? true : router.createUrlTree(['/createurs/connexion']);
};

/** Évite d'afficher les tunnels d'accès à un utilisateur déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn() ? router.createUrlTree([workspaceHome(auth.workspaceType())]) : true;
};

/**
 * Réserve une arborescence à un type d'espace.
 *
 * Posée sur la route parente, elle couvre tous ses enfants : `/entreprise/**`
 * est fermé à un créateur, `/createur/**` à une PME. Un écran ajouté demain
 * sous l'une de ces racines est protégé sans intervention.
 *
 * Masquer une entrée de navigation ne protège rien : l'URL reste atteignable
 * à la main, par un favori ou par un lien partagé. La garde est donc la seule
 * autorisation qui compte ; la navigation, elle, ne fait qu'éviter de proposer
 * ce qui n'a pas de sens pour le profil.
 *
 * Un accès refusé renvoie à l'accueil de l'espace auquel la personne
 * appartient — elle est authentifiée, simplement pas au bon endroit.
 */
export function workspaceGuard(required: WorkspaceType): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.workspaceType() === required
      ? true
      : router.createUrlTree([workspaceHome(auth.workspaceType())]);
  };
}

/** Arborescence `/entreprise/**`. */
export const businessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.workspaceType() !== 'BUSINESS') {
    return router.createUrlTree([workspaceHome(auth.workspaceType())]);
  }
  return auth.hasAnyAuthority('ROLE_BUSINESS_ADMIN', 'ROLE_BUSINESS_MANAGER', 'ROLE_SITE_ADMIN')
    ? true
    : router.createUrlTree(['/createurs/connexion']);
};

/** Arborescence `/createur/**`. */
export const creatorGuard = workspaceGuard('CREATOR');

/**
 * Aiguille vers l'espace de la session. Sert la racine `/app/**`, conservée
 * pour que les liens et favoris de l'ancienne arborescence continuent
 * d'aboutir quelque part de sensé.
 */
export const workspaceHomeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return router.createUrlTree([workspaceHome(auth.workspaceType())]);
};
