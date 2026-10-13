import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { WorkspaceStore } from './workspace-store.service';

/** Réponses minimales des ressources chargées juste après la connexion. */
const WORKSPACE_RESPONSES: Record<string, object> = {
  '/api/creator-profile': {
    id: 'org-1',
    name: 'Alex Nord',
    handle: '@alex.nord',
    email: 'alex@exemple.fr',
    subProfile: 'INFLUENCER',
    platforms: ['TikTok'],
    niche: 'Voyage',
    countryCode: 'FR',
    currency: 'EUR',
    vatRegistered: false,
    plan: 'PRO',
  },
  '/api/settings': {
    businessName: 'Alex Nord',
    address: '',
    countryCode: 'FR',
    taxId: '',
    bankDetails: '',
    logo: null,
    accentColor: '#4F46E5',
    invoicePrefix: 'FA',
    quotePrefix: 'DE',
    creditPrefix: 'AV',
    defaultPaymentTermsDays: 30,
    defaultTerms: '',
    legalMentions: '',
    latePaymentMention: '',
    vatExemptionMention: '',
    invoiceFooter: '',
    currency: 'EUR',
  },
  '/api/brands': [
    {
      id: 'brand-1',
      name: 'Marque API',
      contact: '',
      email: '',
      phone: '',
      address: '',
      countryCode: 'FR',
      paymentTermsDays: 30,
      notes: '',
      remindersPaused: false,
    },
  ],
  '/api/campaigns': [],
  '/api/collaborations': [],
  '/api/subscription': {
    plan: 'PRO',
    status: 'ACTIVE',
    cycle: 'MONTHLY',
    startDate: '2026-01-01',
    trialEndDate: null,
    nextBillingDate: '2026-09-01',
    cancelAtPeriodEnd: false,
  },
  '/api/subscription/invoices': [],
  '/api/invoices': [],
  '/api/quotes': [],
  '/api/reminders/rules': [],
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  /** La connexion enchaîne sur le chargement de l'espace : on le sert ici. */
  function flushWorkspace(): void {
    for (const [url, body] of Object.entries(WORKSPACE_RESPONSES)) {
      http.expectOne(url).flush(body);
    }
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    auth.signOut(false);
  });

  afterEach(() => http.verify());

  it('rejects an invalid email', async () => {
    const result = await firstValueFrom(auth.signIn('toky', 'motdepasse'));
    expect(result.errorKey).toBe('auth.error.email');
    expect(auth.isSignedIn()).toBe(false);
  });

  it('rejects a password that is too short', async () => {
    const result = await firstValueFrom(auth.signIn('toky@exemple.fr', '123'));
    expect(result.errorKey).toBe('auth.error.password');
  });

  it('opens the session returned by the API', async () => {
    const resultPromise = firstValueFrom(auth.signIn('toky@exemple.fr', 'motdepasse'));
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ email: 'toky@exemple.fr', password: 'motdepasse' });
    request.flush({ email: 'toky@exemple.fr', workspaceType: 'CREATOR', accessToken: 'jwt-test' });
    flushWorkspace();

    expect((await resultPromise).ok).toBe(true);
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.workspaceType()).toBe('CREATOR');
  });

  it('loads the workspace from the API right after signing in', async () => {
    const store = TestBed.inject(WorkspaceStore);
    const resultPromise = firstValueFrom(auth.signIn('toky@exemple.fr', 'motdepasse'));
    http
      .expectOne('/api/auth/login')
      .flush({ email: 'toky@exemple.fr', workspaceType: 'CREATOR', accessToken: 'jwt-test' });
    flushWorkspace();
    await resultPromise;

    expect(store.remote()).toBe(true);
    expect(store.brands().map((brand) => brand.name)).toEqual(['Marque API']);
    expect(store.creator().plan).toBe('PRO');
    // La facturation n'est pas encore servie par l'API : rien de fictif.
    expect(store.invoices()).toEqual([]);
  });

  it('returns to the demo data when the session is closed', async () => {
    const store = TestBed.inject(WorkspaceStore);
    const resultPromise = firstValueFrom(auth.signIn('toky@exemple.fr', 'motdepasse'));
    http
      .expectOne('/api/auth/login')
      .flush({ email: 'toky@exemple.fr', workspaceType: 'CREATOR', accessToken: 'jwt-test' });
    flushWorkspace();
    await resultPromise;

    auth.signOut(false);

    expect(store.remote()).toBe(false);
    expect(store.brands().length).toBeGreaterThan(0);
    expect(store.brands().some((brand) => brand.name === 'Marque API')).toBe(false);
  });

  it('uses the workspace attached to each demo account', () => {
    auth.signIn('pme@facturio.example', 'demonstration', 'CREATOR');
    expect(auth.workspaceType()).toBe('BUSINESS');

    auth.signIn('createur@facturio.example', 'demonstration', 'BUSINESS');
    expect(auth.workspaceType()).toBe('CREATOR');
  });

  it('rejects an incorrect password for a demo account', async () => {
    const result = await firstValueFrom(
      auth.signIn('pme@facturio.example', 'motdepasse-invalide', 'BUSINESS'),
    );
    expect(result).toEqual({ ok: false, errorKey: 'auth.error.credentials' });
    expect(auth.isSignedIn()).toBe(false);
  });

  it('creates the account through the API and copies the creator profile', async () => {
    const store = TestBed.inject(WorkspaceStore);
    const data = {
      name: 'Alex Nord',
      handle: '@alex.nord',
      email: 'alex@exemple.fr',
      password: 'motdepasse',
      subProfile: 'INFLUENCER' as const,
      platforms: ['TikTok'],
      niche: 'Voyage',
      country: 'France',
      currency: 'EUR',
      vatRegistered: false,
    };

    const resultPromise = firstValueFrom(auth.signUp(data));
    const request = http.expectOne('/api/auth/signup');
    expect(request.request.body.countryCode).toBe('FR');
    expect(request.request.body.termsAccepted).toBe(true);
    request.flush({ email: data.email, workspaceType: 'CREATOR', accessToken: 'jwt-test' });
    flushWorkspace();

    expect((await resultPromise).ok).toBe(true);
    expect(auth.isSignedIn()).toBe(true);
    expect(store.creator().handle).toBe('@alex.nord');
    expect(store.creator().niche).toBe('Voyage');
  });

  it('closes the local session', () => {
    auth.signIn('createur@facturio.example', 'demonstration');
    auth.signOut(false);
    expect(auth.isSignedIn()).toBe(false);
  });
});
