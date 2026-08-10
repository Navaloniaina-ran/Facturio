import { Injectable, computed, inject, signal } from '@angular/core';
import { ActionResult, WorkspaceType } from './models';
import { WorkspaceStore } from './workspace-store.service';

export interface SignupData {
  name: string;
  handle: string;
  email: string;
  password: string;
  subProfile: 'INFLUENCER' | 'CREATOR' | 'FREELANCE';
  platforms: string[];
  niche: string;
  country: string;
  currency: string;
  vatRegistered: boolean;
}

export interface Session {
  email: string;
  workspaceType: WorkspaceType;
}

const STORAGE_KEY = 'facturio.session';

/**
 * Socle d'authentification unique, trois portails (chapitre 9 du CDC).
 * Ce lot ne livre que le portail CREATOR ; la session porte malgré tout
 * le workspaceType afin que le portail BUSINESS s'y greffe sans refonte.
 *
 * Implémentation de démonstration : aucune requête réseau, la validation
 * réelle des identifiants appartient à l'API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(WorkspaceStore);
  private readonly session = signal<Session | null>(this.readSession());

  readonly currentSession = this.session.asReadonly();
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly workspaceType = computed<WorkspaceType>(
    () => this.session()?.workspaceType ?? 'CREATOR',
  );

  signIn(email: string, password: string): ActionResult {
    if (!email.includes('@')) {
      return { ok: false, errorKey: 'auth.error.email' };
    }
    if (password.length < 6) {
      return { ok: false, errorKey: 'auth.error.password' };
    }

    this.openSession({ email, workspaceType: 'CREATOR' });
    return { ok: true };
  }

  signUp(data: SignupData): ActionResult {
    if (!data.name.trim() || !data.email.includes('@')) {
      return { ok: false, errorKey: 'auth.error.required' };
    }
    if (data.password.length < 6) {
      return { ok: false, errorKey: 'auth.error.password' };
    }

    this.store.creator.update((creator) => ({
      ...creator,
      name: data.name,
      handle: data.handle,
      email: data.email,
      subProfile: data.subProfile,
      platforms: data.platforms,
      niche: data.niche,
      country: data.country,
      currency: data.currency,
      vatRegistered: data.vatRegistered,
    }));

    this.openSession({ email: data.email, workspaceType: 'CREATOR' });
    return { ok: true };
  }

  signOut(): void {
    this.session.set(null);
    this.clearSession();
  }

  private openSession(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Rendu serveur ou stockage indisponible : la session reste en mémoire.
    }
  }

  private readSession(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Rien à nettoyer côté serveur.
    }
  }
}
