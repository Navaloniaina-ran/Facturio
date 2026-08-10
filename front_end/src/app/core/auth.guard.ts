import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protège /app/** : sans session, retour au portail créateur. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn() ? true : router.createUrlTree(['/createurs/connexion']);
};

/** Évite d'afficher les tunnels d'accès à un créateur déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn() ? router.createUrlTree(['/app/tableau-de-bord']) : true;
};
