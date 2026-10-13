import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { SessionDto } from './api/api.dto';
import { countryCodeOf } from './countries';
import { ActionResult, WorkspaceType } from './models';
import { WorkspaceStore } from './workspace-store.service';
import { WorkspaceSyncService } from './workspace-sync.service';
import { PmeStore } from './pme/pme-store.service';

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

/**
 * Une session vient soit du jeu de démonstration, soit de l'API. Le mode dit
 * aux services métier s'ils écrivent en base ou seulement en mémoire.
 */
export type SessionMode = 'DEMO' | 'REMOTE';

export interface Session {
  email: string;
  workspaceType: WorkspaceType;
  mode: SessionMode;
  name?: string;
  memberRole: string;
  platformRole: string;
  authorities: string[];
  accessToken?: string;
}

interface ApiErrorBody {
  code?: string;
}

const STORAGE_KEY = 'facturio.session';
const TOKEN_KEY = 'facturio.access_token';

/** Comptes de démonstration disponibles sans écriture en base. */
export const DEMO_ACCOUNTS: ReadonlyArray<{
  email: string;
  password: string;
  workspaceType: WorkspaceType;
}> = [
  { email: 'createur@facturio.example', password: 'demonstration', workspaceType: 'CREATOR' },
  { email: 'pme@facturio.example', password: 'demonstration', workspaceType: 'BUSINESS' },
];

/** Authentification email/mot de passe par l'API Spring Boot. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(WorkspaceStore);
  private readonly sync = inject(WorkspaceSyncService);
  private readonly pme = inject(PmeStore);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly session = signal<Session | null>(this.readSession());

  readonly currentSession = this.session.asReadonly();
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly workspaceType = computed<WorkspaceType>(
    () => this.session()?.workspaceType ?? 'CREATOR',
  );

  /** Vrai lorsque la session est servie par l'API et non par la démonstration. */
  readonly isRemote = computed(() => this.session()?.mode === 'REMOTE');
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly authorities = computed(() => this.session()?.authorities ?? []);
  readonly isSiteAdmin = computed(() => this.authorities().includes('ROLE_SITE_ADMIN'));

  hasAnyAuthority(...authorities: string[]): boolean {
    const granted = this.authorities();
    return authorities.some((authority) => granted.includes(authority));
  }

  /**
   * Reprise de session au démarrage : le cookie de session porte l'identité,
   * le serveur reste seul juge. Une démonstration, elle, se poursuit hors ligne.
   */
  restore(): Observable<boolean> {
    const stored = this.session();
    if (stored?.mode === 'DEMO') {
      return of(true);
    }
    if (!this.http) {
      this.forget();
      return of(false);
    }

    return this.http.get<SessionDto>('/api/auth/session').pipe(
      switchMap((session) => {
        this.openSession(this.toSession(session));
        return this.sync.load(session.workspaceType).pipe(map(() => true));
      }),
      catchError(() => {
        this.forget();
        return of(false);
      }),
    );
  }

  signIn(
    email: string,
    password: string,
    workspaceType: WorkspaceType = 'CREATOR',
  ): Observable<ActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      return of({ ok: false, errorKey: 'auth.error.email' });
    }
    if (password.length < 8) {
      return of({ ok: false, errorKey: 'auth.error.password' });
    }

    const demoAccount = DEMO_ACCOUNTS.find((account) => account.email === normalizedEmail);
    if (demoAccount && demoAccount.password !== password) {
      return of({ ok: false, errorKey: 'auth.error.credentials' });
    }
    if (demoAccount) {
      this.store.resetDemo();
      this.openSession({
        email: normalizedEmail,
        workspaceType: demoAccount.workspaceType,
        mode: 'DEMO',
        memberRole: 'OWNER',
        platformRole: 'USER',
        authorities:
          demoAccount.workspaceType === 'CREATOR'
            ? ['ROLE_CREATOR']
            : ['ROLE_BUSINESS_ADMIN', 'ROLE_WORKSPACE_ADMIN'],
      });
      return of({ ok: true });
    }
    if (!this.http) {
      return of({ ok: false, errorKey: 'http.error.offline' });
    }

    return this.http.post<SessionDto>('/api/auth/login', { email: normalizedEmail, password }).pipe(
      switchMap((session) => this.openRemoteSession(session)),
      catchError((error: HttpErrorResponse) =>
        of({ ok: false, errorKey: this.loginErrorKey(error) }),
      ),
    );
  }

  signUp(data: SignupData): Observable<ActionResult> {
    if (!data.name.trim() || !data.email.includes('@')) {
      return of({ ok: false, errorKey: 'auth.error.required' });
    }
    if (data.password.length < 8) {
      return of({ ok: false, errorKey: 'auth.error.password' });
    }
    if (!this.http) {
      return of({ ok: false, errorKey: 'http.error.offline' });
    }

    return this.http
      .post<SessionDto>('/api/auth/signup', {
        name: data.name.trim(),
        handle: data.handle,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        profileType: data.subProfile,
        platforms: data.platforms,
        niche: data.niche,
        countryCode: countryCodeOf(data.country),
        currency: data.currency,
        termsAccepted: true,
      })
      .pipe(
        tap(() => this.updateCreator(data)),
        switchMap((session) => this.openRemoteSession(session)),
        catchError((error: HttpErrorResponse) =>
          of({ ok: false, errorKey: this.signupErrorKey(error) }),
        ),
      );
  }

  signOut(notifyServer = true): void {
    if (notifyServer && this.http) {
      this.http.post<void>('/api/auth/logout', {}).subscribe({ error: () => undefined });
    }
    this.forget();
  }

  /** Ouvre la session serveur puis charge l'espace avant de rendre la main. */
  private openRemoteSession(session: SessionDto): Observable<ActionResult> {
    this.openSession(this.toSession(session));
    return this.sync.load(session.workspaceType).pipe(map(() => ({ ok: true })));
  }

  private toSession(session: SessionDto): Session {
    return {
      email: session.email,
      workspaceType: session.workspaceType,
      mode: 'REMOTE',
      name: session.name,
      memberRole: session.memberRole ?? 'MEMBER',
      platformRole: session.platformRole ?? 'USER',
      authorities:
        session.authorities ??
        (session.workspaceType === 'CREATOR' ? ['ROLE_CREATOR'] : ['ROLE_BUSINESS_VIEWER']),
      accessToken: session.accessToken,
    };
  }

  /** Ferme la session locale et rend l'espace au jeu de démonstration. */
  private forget(): void {
    this.session.set(null);
    this.clearSession();
    this.store.resetDemo();
    this.pme.useDemo();
  }

  private updateCreator(data: SignupData): void {
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
  }

  private loginErrorKey(error: HttpErrorResponse): string {
    return error.status === 401 ? 'auth.error.credentials' : this.networkErrorKey(error);
  }

  private signupErrorKey(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorBody | null;
    return error.status === 409 && body?.code === 'email_already_used'
      ? 'signup.error.emailUsed'
      : this.networkErrorKey(error);
  }

  private networkErrorKey(error: HttpErrorResponse): string {
    return error.status === 0 ? 'http.error.offline' : 'http.error.unknown';
  }

  private openSession(session: Session): void {
    this.session.set(session);
    try {
      const { accessToken, ...metadata } = session;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
      if (accessToken) {
        sessionStorage.setItem(TOKEN_KEY, accessToken);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // La session reste en mémoire si le stockage est indisponible.
    }
  }

  private readSession(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as Session;
      // Les sessions écrites avant l'intégration de l'API n'ont pas de mode.
      return {
        ...session,
        mode: session.mode ?? 'DEMO',
        memberRole: session.memberRole ?? 'OWNER',
        platformRole: session.platformRole ?? 'USER',
        authorities:
          session.authorities ??
          (session.workspaceType === 'CREATOR' ? ['ROLE_CREATOR'] : ['ROLE_BUSINESS_ADMIN']),
        accessToken: sessionStorage.getItem(TOKEN_KEY) ?? undefined,
      };
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Rien à nettoyer si le stockage est indisponible.
    }
  }
}
