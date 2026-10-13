import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
    TestBed.inject(AuthService).signOut(false);
  });

  async function create() {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    return fixture;
  }

  function fill(fixture: ComponentFixture<LoginComponent>, email: string, password: string) {
    const fields = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    fields[0].value = email;
    fields[0].dispatchEvent(new Event('input'));
    fields[1].value = password;
    fields[1].dispatchEvent(new Event('input'));
  }

  it('offers the business portal and the creator signup', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Portail entreprise');
    expect(text).toContain('Créer mon espace créateur');
  });

  it('translates the whole page into English', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sign in to your space');
    expect(text).toContain('Business portal');
    expect(text).not.toContain('Connexion à votre espace');
  });

  it('shows the error returned by the auth service', async () => {
    const fixture = await create();
    fill(fixture, 'toky', 'motdepasse');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Adresse email invalide.');
  });

  it('redirects to the dashboard once signed in', async () => {
    const fixture = await create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    fill(fixture, 'createur@facturio.example', 'demonstration');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).isSignedIn()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/createur/tableau-de-bord']);
  });

  it('opens a CREATOR workspace from the creator portal', async () => {
    const fixture = await create();
    // Le routeur de test ne connaît aucune route : on neutralise la
    // navigation, seul le type d'espace ouvert nous intéresse ici.
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fill(fixture, 'createur@facturio.example', 'demonstration');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).workspaceType()).toBe('CREATOR');
  });

  it('lets the visitor switch language before signing in', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-language-switch')).toBeTruthy();
  });
});

describe('LoginComponent — portail entreprise', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        // La route `/entreprises/connexion` porte cette donnée : c'est elle
        // qui distingue les deux portails.
        { provide: ActivatedRoute, useValue: { snapshot: { data: { businessPortal: true } } } },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
    TestBed.inject(AuthService).signOut(false);
  });

  it('opens a BUSINESS workspace and speaks the PME vocabulary', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const fields = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    fields[0].value = 'pme@facturio.example';
    fields[0].dispatchEvent(new Event('input'));
    fields[1].value = 'demonstration';
    fields[1].dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const auth = TestBed.inject(AuthService);
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.workspaceType()).toBe('BUSINESS');
    // Une PME parle de « Clients », un créateur de « Marques ».
    expect(TestBed.inject(I18nService).vocab('clients')).toBe('Clients');
  });
});
