import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { WorkspaceStore } from './workspace-store.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
    auth.signOut();
  });

  it('rejects an invalid email', () => {
    expect(auth.signIn('toky', 'motdepasse').errorKey).toBe('auth.error.email');
    expect(auth.isSignedIn()).toBe(false);
  });

  it('rejects a password that is too short', () => {
    expect(auth.signIn('toky@exemple.fr', '123').errorKey).toBe('auth.error.password');
  });

  it('opens a CREATOR session', () => {
    expect(auth.signIn('toky@exemple.fr', 'motdepasse').ok).toBe(true);
    expect(auth.isSignedIn()).toBe(true);
    expect(auth.workspaceType()).toBe('CREATOR');
  });

  it('copies the signup data onto the creator profile', () => {
    const store = TestBed.inject(WorkspaceStore);

    auth.signUp({
      name: 'Alex Nord',
      handle: '@alex.nord',
      email: 'alex@exemple.fr',
      password: 'motdepasse',
      subProfile: 'INFLUENCER',
      platforms: ['TikTok'],
      niche: 'Voyage',
      country: 'France',
      currency: 'EUR',
      vatRegistered: false,
    });

    expect(auth.isSignedIn()).toBe(true);
    expect(store.creator().handle).toBe('@alex.nord');
    expect(store.creator().vatRegistered).toBe(false);
  });

  it('closes the session on sign out', () => {
    auth.signIn('toky@exemple.fr', 'motdepasse');
    auth.signOut();
    expect(auth.isSignedIn()).toBe(false);
  });
});
