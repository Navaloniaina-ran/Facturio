import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { InscriptionComponent } from './inscription.component';

describe('InscriptionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InscriptionComponent],
      providers: [provideRouter([{ path: 'app/tableau-de-bord', children: [] }])],
    }).compileComponents();
    TestBed.inject(AuthService).deconnexion();
  });

  async function creer() {
    const fixture = TestBed.createComponent(InscriptionComponent);
    await fixture.whenStable();
    return fixture;
  }

  async function remplirEtape1(fixture: Awaited<ReturnType<typeof creer>>) {
    const composant = fixture.componentInstance as unknown as {
      formulaire: { nom: string; email: string; motDePasse: string };
      cgu: boolean;
      suivant(): void;
      valider(): void;
    };
    composant.formulaire.nom = 'Alex Nord';
    composant.formulaire.email = 'alex@exemple.fr';
    composant.formulaire.motDePasse = 'motdepasse';
    composant.suivant();
    await fixture.whenStable();
    return composant;
  }

  it('démarre à l’étape 1 sur 2', async () => {
    const fixture = await creer();
    expect(fixture.nativeElement.textContent).toContain('Étape 1 / 2');
  });

  it('refuse de passer à l’étape 2 si les champs obligatoires manquent', async () => {
    const fixture = await creer();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const texte = fixture.nativeElement.textContent as string;
    expect(texte).toContain('Étape 1 / 2');
    expect(texte).toContain('Nom, email valide et mot de passe');
  });

  it('exige l’acceptation des CGU avant de créer l’espace', async () => {
    const fixture = await creer();
    const composant = await remplirEtape1(fixture);

    composant.valider();
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).estConnecte()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('conditions générales');
  });

  it('crée l’espace créateur quand tout est renseigné', async () => {
    const fixture = await creer();
    const composant = await remplirEtape1(fixture);

    composant.cgu = true;
    composant.valider();
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).estConnecte()).toBe(true);
  });
});
