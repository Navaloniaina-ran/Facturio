import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ConnexionComponent } from './connexion.component';

describe('ConnexionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ConnexionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(AuthService).deconnexion();
  });

  async function creer() {
    const fixture = TestBed.createComponent(ConnexionComponent);
    await fixture.whenStable();
    return fixture;
  }

  function saisir(fixture: Awaited<ReturnType<typeof creer>>, email: string, motDePasse: string) {
    const champs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    champs[0].value = email;
    champs[0].dispatchEvent(new Event('input'));
    champs[1].value = motDePasse;
    champs[1].dispatchEvent(new Event('input'));
  }

  it('propose le portail entreprise et l’inscription créateur', async () => {
    const fixture = await creer();
    const texte = fixture.nativeElement.textContent as string;

    expect(texte).toContain('Portail entreprise');
    expect(texte).toContain('Créer mon espace créateur');
  });

  it('affiche l’erreur renvoyée par le service d’authentification', async () => {
    const fixture = await creer();
    saisir(fixture, 'toky', 'motdepasse');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Adresse email invalide.');
  });

  it('redirige vers le tableau de bord après authentification', async () => {
    const fixture = await creer();
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigate');

    saisir(fixture, 'toky@exemple.fr', 'motdepasse');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).estConnecte()).toBe(true);
    expect(navigation).toHaveBeenCalledWith(['/app/tableau-de-bord'], expect.anything());
  });
});
