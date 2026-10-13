import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CreatorShellComponent } from './creator-shell.component';

describe('CreatorShellComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CreatorShellComponent],
      providers: [
        provideRouter([
          { path: 'createurs/connexion', children: [] },
          { path: 'app/abonnement', children: [] },
        ]),
      ],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(CreatorShellComponent);
    await fixture.whenStable();
    return fixture;
  }

  /** Le déclencheur du menu est le bouton portant le nom de l'utilisateur. */
  function openUserMenu(fixture: { nativeElement: HTMLElement }) {
    const trigger = fixture.nativeElement.querySelector(
      'header button[aria-haspopup=menu]',
    ) as HTMLButtonElement;
    trigger.click();
  }

  it('lists the eleven modules of the creator space', async () => {
    const fixture = await create();
    const paths = [...fixture.nativeElement.querySelectorAll('nav a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );

    expect(paths.length).toBe(11);
    expect(paths).toContain('/collaborations');
    expect(paths).toContain('/modeles');
    expect(paths).toContain('/parametres');
  });

  it('uses the creator vocabulary', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.querySelector('nav').textContent as string;

    expect(text).toContain('Marques');
    expect(text).toContain('Campagnes');
    expect(text).toContain('Propositions');
    expect(text).not.toContain('Devis');
  });

  it('translates the navigation when the language changes', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.querySelector('nav').textContent as string;
    expect(text).toContain('Brands');
    expect(text).toContain('Campaigns');
    expect(text).not.toContain('Marques');
  });

  it('locks the page height and scrolls the content only', async () => {
    const fixture = await create();
    const root = fixture.nativeElement.firstElementChild as HTMLElement;
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;

    expect(root.className).toContain('h-dvh');
    expect(root.className).toContain('overflow-hidden');
    expect(main.className).toContain('overflow-y-auto');
    expect(aside.className).not.toContain('overflow-y-auto');
  });

  it('offers the language switch in the top bar', async () => {
    const fixture = await create();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;

    expect(header.querySelector('app-language-switch')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('aside app-language-switch')).toBeNull();
  });

  it('hides the account actions until the user menu is opened', async () => {
    const fixture = await create();

    expect(fixture.nativeElement.querySelector('[role=menu]')).toBeNull();

    openUserMenu(fixture);
    await fixture.whenStable();

    const menu = fixture.nativeElement.querySelector('[role=menu]') as HTMLElement;
    expect(menu.textContent).toContain('Gérer mon abonnement');
    expect(menu.textContent).toContain('Se déconnecter');
  });

  it('links the menu to the subscription screen', async () => {
    const fixture = await create();
    openUserMenu(fixture);
    await fixture.whenStable();

    // Lien relatif : monté à la racine dans le test, il devient /app/abonnement
    // sous la route « app » de l'application.
    const links = [...fixture.nativeElement.querySelectorAll('[role=menu] a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );
    expect(links).toEqual(['/abonnement', '/parametres']);
  });

  it('signs the creator out from the user menu', async () => {
    const auth = TestBed.inject(AuthService);
    auth.signIn('toky@exemple.fr', 'motdepasse');

    const fixture = await create();
    openUserMenu(fixture);
    await fixture.whenStable();

    const menu = fixture.nativeElement.querySelector('[role=menu]') as HTMLElement;
    ([...menu.querySelectorAll('button')] as HTMLButtonElement[])
      .find((button) => button.textContent?.includes('Se déconnecter'))
      ?.click();

    expect(auth.isSignedIn()).toBe(false);
  });

  // La navigation est le premier endroit où les deux profils divergent.
  it('serves the PME navigation to a BUSINESS workspace', async () => {
    TestBed.inject(AuthService).signIn('pme@facturio.example', 'demonstration', 'BUSINESS');

    const fixture = await create();
    const nav = fixture.nativeElement.querySelector('nav');
    const text = nav.textContent as string;
    const paths = [...nav.querySelectorAll('a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );

    expect(paths).toContain('/clients');
    expect(paths).toContain('/fournisseurs');
    expect(paths).not.toContain('/marques');
    expect(paths).not.toContain('/campagnes');
    expect(paths).not.toContain('/collaborations');

    // Le vocabulaire suit le profil : « Devis » et non « Propositions ».
    expect(text).toContain('Fournisseurs');
    expect(text).toContain('Devis');
    expect(text).not.toContain('Propositions');
  });
});
