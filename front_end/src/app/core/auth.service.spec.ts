import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { EspaceStoreService } from './espace-store.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
    auth.deconnexion();
  });

  it('refuse un email invalide', () => {
    expect(auth.connexion('toky', 'motdepasse')).toEqual({
      ok: false,
      message: 'Adresse email invalide.',
    });
    expect(auth.estConnecte()).toBe(false);
  });

  it('refuse un mot de passe trop court', () => {
    expect(auth.connexion('toky@exemple.fr', '123').ok).toBe(false);
  });

  it('ouvre une session de type CREATOR', () => {
    expect(auth.connexion('toky@exemple.fr', 'motdepasse').ok).toBe(true);
    expect(auth.estConnecte()).toBe(true);
    expect(auth.workspaceType()).toBe('CREATOR');
  });

  it('reporte les informations d’inscription sur le profil du créateur', () => {
    const store = TestBed.inject(EspaceStoreService);

    auth.inscription({
      nom: 'Alex Nord',
      pseudo: '@alex.nord',
      email: 'alex@exemple.fr',
      motDePasse: 'motdepasse',
      sousProfil: 'INFLUENCEUR',
      plateformes: ['TikTok'],
      thematique: 'Voyage',
      pays: 'France',
      devise: 'EUR',
      assujettiTva: false,
    });

    expect(auth.estConnecte()).toBe(true);
    expect(store.createur().pseudo).toBe('@alex.nord');
    expect(store.createur().assujettiTva).toBe(false);
  });

  it('ferme la session à la déconnexion', () => {
    auth.connexion('toky@exemple.fr', 'motdepasse');
    auth.deconnexion();
    expect(auth.estConnecte()).toBe(false);
  });
});
