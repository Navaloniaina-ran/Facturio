import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard, businessGuard, creatorGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

/** Exécute une garde dans un contexte d'injection, comme le fait le routeur. */
function run(guard: CanActivateFn): boolean | UrlTree {
  return TestBed.runInInjectionContext(
    () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as boolean | UrlTree,
  );
}

/** Chemin visé par une redirection, pour comparer lisiblement. */
function target(result: boolean | UrlTree): string {
  return result instanceof UrlTree ? result.toString() : String(result);
}

describe('gardes de route', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    auth.signOut(false);
  });

  describe('authGuard', () => {
    it('sends an anonymous visitor to the creator portal', () => {
      expect(target(run(authGuard))).toBe('/createurs/connexion');
    });

    it('lets a signed-in user through, whatever the workspace', () => {
      auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR');
      expect(run(authGuard)).toBe(true);

      auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
      expect(run(authGuard)).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('lets an anonymous visitor reach the sign-in screens', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('redirects an already signed-in user to their own workspace', () => {
      auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
      expect(target(run(guestGuard))).toBe('/entreprise/tableau-de-bord');
    });
  });

  describe('businessGuard — écrans clients et fournisseurs', () => {
    it('lets a PME through', () => {
      auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
      expect(run(businessGuard)).toBe(true);
    });

    // Masquer l'entrée de navigation ne protège rien : l'URL reste atteignable.
    it('turns a creator away, even by direct URL', () => {
      auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR');
      expect(target(run(businessGuard))).toBe('/createur/tableau-de-bord');
    });
  });

  describe('creatorGuard — écrans marques, campagnes, collaborations', () => {
    it('lets a creator through', () => {
      auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR');
      expect(run(creatorGuard)).toBe(true);
    });

    it('turns a PME away, even by direct URL', () => {
      auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
      expect(target(run(creatorGuard))).toBe('/entreprise/tableau-de-bord');
    });
  });

  it('never leaves a signed-in user stranded on the sign-in screen', () => {
    // Un accès refusé renvoie à l'accueil de l'espace auquel la personne
    // appartient : elle est authentifiée, simplement pas au bon endroit.
    auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');

    for (const guard of [creatorGuard, businessGuard]) {
      const result = run(guard);
      expect(target(result)).not.toContain('connexion');
    }
  });
});
