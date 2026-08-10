import { Injectable, computed, inject, signal } from '@angular/core';
import { EspaceStoreService } from './espace-store.service';
import { WorkspaceType } from './modeles';

export interface InscriptionCreateur {
  nom: string;
  pseudo: string;
  email: string;
  motDePasse: string;
  sousProfil: 'INFLUENCEUR' | 'CREATEUR' | 'FREELANCE';
  plateformes: string[];
  thematique: string;
  pays: string;
  devise: string;
  assujettiTva: boolean;
}

export interface Session {
  email: string;
  workspaceType: WorkspaceType;
}

const CLE_SESSION = 'facturio.session';

/**
 * Socle d'authentification unique, trois portails (chapitre 9 du CDC).
 * Ce lot ne livre que le portail CREATOR ; la session porte malgré tout
 * le workspace_type afin que le portail BUSINESS s'y greffe sans refonte.
 *
 * Implémentation de démonstration : aucune requête réseau, la validation
 * réelle des identifiants appartient à l'API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(EspaceStoreService);
  private readonly session = signal<Session | null>(this.lireSession());

  readonly sessionCourante = this.session.asReadonly();
  readonly estConnecte = computed(() => this.session() !== null);
  readonly workspaceType = computed<WorkspaceType>(() => this.session()?.workspaceType ?? 'CREATOR');

  connexion(email: string, motDePasse: string): { ok: boolean; message?: string } {
    if (!email.includes('@')) {
      return { ok: false, message: 'Adresse email invalide.' };
    }
    if (motDePasse.length < 6) {
      return { ok: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }

    this.ouvrirSession({ email, workspaceType: 'CREATOR' });
    return { ok: true };
  }

  inscription(donnees: InscriptionCreateur): { ok: boolean; message?: string } {
    if (!donnees.nom.trim() || !donnees.email.includes('@')) {
      return { ok: false, message: 'Nom et email sont obligatoires.' };
    }
    if (donnees.motDePasse.length < 6) {
      return { ok: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }

    this.store.createur.update((createur) => ({
      ...createur,
      nom: donnees.nom,
      pseudo: donnees.pseudo,
      email: donnees.email,
      sousProfil: donnees.sousProfil,
      plateformes: donnees.plateformes,
      thematique: donnees.thematique,
      pays: donnees.pays,
      devise: donnees.devise,
      assujettiTva: donnees.assujettiTva,
    }));

    this.ouvrirSession({ email: donnees.email, workspaceType: 'CREATOR' });
    return { ok: true };
  }

  deconnexion(): void {
    this.session.set(null);
    this.effacerSession();
  }

  private ouvrirSession(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    } catch {
      // Rendu serveur ou stockage indisponible : la session reste en mémoire.
    }
  }

  private lireSession(): Session | null {
    try {
      const brut = localStorage.getItem(CLE_SESSION);
      return brut ? (JSON.parse(brut) as Session) : null;
    } catch {
      return null;
    }
  }

  private effacerSession(): void {
    try {
      localStorage.removeItem(CLE_SESSION);
    } catch {
      // Rien à nettoyer côté serveur.
    }
  }
}
