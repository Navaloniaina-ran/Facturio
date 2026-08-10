import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { EspaceCreateurComponent } from './espace-createur.component';

describe('EspaceCreateurComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceCreateurComponent],
      providers: [provideRouter([{ path: 'createurs/connexion', children: [] }])],
    }).compileComponents();
  });

  async function creer() {
    const fixture = TestBed.createComponent(EspaceCreateurComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('affiche les huit modules de l’espace créateur', async () => {
    const fixture = await creer();
    const liens = fixture.nativeElement.querySelectorAll('nav a');

    expect(liens.length).toBe(8);
  });

  it('utilise le vocabulaire créateur', async () => {
    const fixture = await creer();
    const texte = fixture.nativeElement.querySelector('nav').textContent as string;

    expect(texte).toContain('Marques');
    expect(texte).toContain('Campagnes');
    expect(texte).toContain('Propositions');
    expect(texte).not.toContain('Devis');
  });

  it('ferme la session à la déconnexion', async () => {
    const auth = TestBed.inject(AuthService);
    auth.connexion('toky@exemple.fr', 'motdepasse');

    const fixture = await creer();
    const boutons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    boutons.find((bouton) => bouton.textContent?.includes('Se déconnecter'))?.click();

    expect(auth.estConnecte()).toBe(false);
  });
});
