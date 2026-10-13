import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'createur/tableau-de-bord', children: [] }]),
      ],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
    TestBed.inject(AuthService).signOut(false);
  });

  async function create() {
    const fixture = TestBed.createComponent(SignupComponent);
    await fixture.whenStable();
    return fixture;
  }

  function fill(fixture: ComponentFixture<SignupComponent>, selector: string, value: string) {
    const field = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function submit(fixture: ComponentFixture<SignupComponent>) {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  }

  /** Passe l'étape 1 en remplissant le formulaire comme un utilisateur. */
  async function goToStep2(fixture: ComponentFixture<SignupComponent>) {
    fill(fixture, '#name', 'Alex Nord');
    fill(fixture, '#email', 'alex@exemple.fr');
    fill(fixture, '#password', 'motdepasse');
    fill(fixture, '#confirmPassword', 'motdepasse');
    submit(fixture);
    await fixture.whenStable();
  }

  it('starts on step 1 of 2', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Étape 1 / 2');
  });

  it('uses email and password without social account buttons', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.querySelectorAll('a[href^="/oauth2/"]').length).toBe(0);
    expect(fixture.nativeElement.querySelector('#email')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#password')).not.toBeNull();
  });

  it('translates the step counter', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Step 1 of 2');
  });

  it('refuses to move on when required fields are missing', async () => {
    const fixture = await create();

    submit(fixture);
    await fixture.whenStable();

    // L'envoi est retenu par le formulaire lui-même : on reste à l'étape 1
    // et chaque champ manquant se signale sur place, en rouge.
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Étape 1 / 2');
    expect(text).toContain('Complétez les champs signalés en rouge');
    expect(fixture.nativeElement.querySelectorAll('.field.ng-invalid').length).toBeGreaterThan(0);
  });

  it('reaches step 2 once step 1 is valid', async () => {
    const fixture = await create();
    await goToStep2(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Étape 2 / 2');
    expect(text).toContain('Plateformes principales');
  });

  it('refuses two different passwords', async () => {
    const fixture = await create();
    fill(fixture, '#name', 'Alex Nord');
    fill(fixture, '#email', 'alex@exemple.fr');
    fill(fixture, '#password', 'motdepasse');
    fill(fixture, '#confirmPassword', 'autre-mot-de-passe');

    submit(fixture);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('ne correspondent pas');
    expect(fixture.nativeElement.textContent).toContain('Étape 1 / 2');
  });

  it('defers tax and bank information until onboarding', async () => {
    const fixture = await create();
    await goToStep2(fixture);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Logo, TVA, mentions légales');
    expect(fixture.nativeElement.querySelector('input[name=vatRegistered]')).toBeNull();
  });

  it('requires the terms before creating the space', async () => {
    const fixture = await create();
    await goToStep2(fixture);

    submit(fixture);
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).isSignedIn()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('conditions générales');
  });

  it('creates the creator space when everything is filled in', async () => {
    const fixture = await create();
    await goToStep2(fixture);

    (fixture.nativeElement.querySelector('input[name=terms]') as HTMLInputElement).click();
    await fixture.whenStable();

    submit(fixture);
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/signup')
      .flush({ email: 'alex@exemple.fr', workspaceType: 'CREATOR' });
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).isSignedIn()).toBe(true);
  });
});
