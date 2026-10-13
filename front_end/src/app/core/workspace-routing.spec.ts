import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { AuthService } from './auth.service';

/**
 * Autorisations d'accès, vérifiées par le routeur lui-même.
 *
 * Le test des gardes isolées dit qu'elles décident bien ; celui-ci dit que le
 * plan de routes les a effectivement posées. Depuis que chaque espace a sa
 * propre arborescence, la garde est portée par la route parente : ce test
 * vérifie que l'héritage joue pour tous les enfants, y compris les écrans
 * partagés montés sous les deux racines.
 */
describe('autorisations par type d’espace', () => {
  let router: Router;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    auth.signOut(false);
  });

  /** Navigue et renvoie l'URL réellement atteinte. */
  async function goTo(url: string): Promise<string> {
    await router.navigateByUrl(url);
    return router.url;
  }

  /** Écrans montés sous les deux racines. */
  const SHARED = [
    'tableau-de-bord',
    'propositions',
    'factures',
    'paiements',
    'relances',
    'modeles',
    'rapports',
    'parametres',
    'abonnement',
  ];

  const CREATOR_ONLY = ['marques', 'campagnes', 'collaborations'];
  const BUSINESS_ONLY = ['clients', 'fournisseurs'];

  it('sends an anonymous visitor to the creator portal', async () => {
    expect(await goTo('/createur/factures')).toBe('/createurs/connexion');
    expect(await goTo('/entreprise/clients')).toBe('/createurs/connexion');
  });

  describe('espace créateur', () => {
    beforeEach(() => auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR'));

    it('reaches its own screens', async () => {
      for (const screen of CREATOR_ONLY) {
        expect(await goTo(`/createur/${screen}`)).toBe(`/createur/${screen}`);
      }
    });

    it('reaches every shared screen under its own root', async () => {
      for (const screen of SHARED) {
        expect(await goTo(`/createur/${screen}`)).toBe(`/createur/${screen}`);
      }
    });

    // La garde du parent couvre aussi les écrans partagés de l'autre racine.
    it('is turned away from the whole PME tree, back to its own home', async () => {
      for (const screen of [...BUSINESS_ONLY, ...SHARED]) {
        expect(await goTo(`/entreprise/${screen}`)).toBe('/createur/tableau-de-bord');
      }
    });
  });

  describe('espace PME', () => {
    beforeEach(() => auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS'));

    it('reaches its own screens', async () => {
      for (const screen of BUSINESS_ONLY) {
        expect(await goTo(`/entreprise/${screen}`)).toBe(`/entreprise/${screen}`);
      }
    });

    it('reaches every shared screen under its own root', async () => {
      for (const screen of SHARED) {
        expect(await goTo(`/entreprise/${screen}`)).toBe(`/entreprise/${screen}`);
      }
    });

    it('is turned away from the whole creator tree, back to its own home', async () => {
      for (const screen of [...CREATOR_ONLY, ...SHARED]) {
        expect(await goTo(`/createur/${screen}`)).toBe('/entreprise/tableau-de-bord');
      }
    });
  });

  it('lands on the dashboard when only the workspace root is given', async () => {
    auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR');
    expect(await goTo('/createur')).toBe('/createur/tableau-de-bord');

    auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
    expect(await goTo('/entreprise')).toBe('/entreprise/tableau-de-bord');
  });

  // L'ancienne racine unique reste en circulation dans les favoris.
  it('routes the legacy /app links to the workspace of the session', async () => {
    auth.signIn('pme@facturio.example', 'demonstration', 'BUSINESS');
    expect(await goTo('/app')).toBe('/entreprise/tableau-de-bord');
    expect(await goTo('/app/factures')).toBe('/entreprise/tableau-de-bord');

    auth.signIn('createur@facturio.example', 'demonstration', 'CREATOR');
    expect(await goTo('/app/marques')).toBe('/createur/tableau-de-bord');
  });

  it('sends an anonymous visitor on a legacy link to the portal', async () => {
    expect(await goTo('/app/factures')).toBe('/createurs/connexion');
  });
});
