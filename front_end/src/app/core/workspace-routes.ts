import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { WorkspaceType } from './models';

/**
 * Racine d'URL de chaque espace.
 *
 * Les deux espaces ont leur propre arborescence de routes : `/creator/**` et
 * `/company/**`. L'autorisation est ainsi portée une seule fois, par la route
 * parente, au lieu d'être répétée sur chaque enfant — un enfant ajouté plus
 * tard hérite de la garde sans qu'on ait à y penser.
 *
 * Les URL sont en anglais, au singulier pour les espaces et au pluriel pour
 * les portails d'entrée (`/creators/sign-in`) : les deux familles ne peuvent
 * donc pas entrer en collision.
 */
export const WORKSPACE_BASE: Record<WorkspaceType, string> = {
  CREATOR: 'createur',
  BUSINESS: 'entreprise',
};

/** Écran d'accueil d'un espace, cible de toutes les redirections. */
export function workspaceHome(type: WorkspaceType): string {
  return `/${WORKSPACE_BASE[type]}/tableau-de-bord`;
}

/**
 * Construit les liens de l'espace courant.
 *
 * Les écrans partagés — invoices, payments, reminders, templates — existent
 * sous les deux racines. Un lien écrit en dur vers l'une d'elles serait juste
 * pour un profil et faux pour l'autre : tout lien absolu passe donc par ici.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceRoutes {
  private readonly auth = inject(AuthService);

  /** Racine de l'espace courant, avec sa barre oblique de tête. */
  readonly base = computed(() => `/${WORKSPACE_BASE[this.auth.workspaceType()]}`);

  readonly home = computed(() => workspaceHome(this.auth.workspaceType()));

  /** Commande de lien pour `routerLink` et `Router.navigate`. */
  to(...segments: (string | number)[]): (string | number)[] {
    return [this.base(), ...segments];
  }

  /** Même chose sous forme de chaîne, pour les composants qui attendent une URL. */
  url(...segments: (string | number)[]): string {
    return [this.base(), ...segments].join('/');
  }
}
