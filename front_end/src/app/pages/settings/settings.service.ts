import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, of, tap } from 'rxjs';
import { apiErrorResult } from '../../core/api/api-error';
import { CreatorApiService } from '../../core/api/creator-api.service';
import { ActionResult, Settings } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';

/** Taille maximale du logo embarqué dans les documents. */
export const MAX_LOGO_BYTES = 1_000_000;

/** Formats d'image acceptés pour le logo. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const PREFIX_PATTERN = /^[A-Za-z]{2,6}$/;

/** Lecture d'une image en data URI : le logo suit la facture jusqu'au PDF. */
function readDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Paramètres de l'espace : tout ce qui ne se règle qu'une fois — identité,
 * logo, numérotation, conditions et mentions légales. La TVA n'y figure pas :
 * elle se décide document par document.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(WorkspaceStore);
  private readonly api = inject(CreatorApiService);

  readonly current = this.store.settings.asReadonly();

  /** Enregistre le brouillon complet : logo compris, rien n'est appliqué avant. */
  save(draft: Settings): Observable<ActionResult> {
    const prefixes = [draft.invoicePrefix, draft.quotePrefix, draft.creditPrefix];
    if (prefixes.some((prefix) => !PREFIX_PATTERN.test(prefix))) {
      return of({ ok: false, errorKey: 'settings.error.prefix' });
    }

    const settings: Settings = {
      ...draft,
      invoicePrefix: draft.invoicePrefix.toUpperCase(),
      quotePrefix: draft.quotePrefix.toUpperCase(),
      creditPrefix: draft.creditPrefix.toUpperCase(),
    };

    if (!this.store.remote()) {
      this.store.settings.set(settings);
      return of({ ok: true });
    }

    return this.api.saveSettings(settings).pipe(
      tap((saved) => this.store.settings.set(saved)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  /**
   * Prépare le logo choisi et renvoie ce qu'il faut inscrire dans le brouillon.
   * Hors ligne, l'image est embarquée en data URI ; connecté, elle est déposée
   * sur le serveur qui n'en conserve que l'URL.
   */
  prepareLogo(file: File): Observable<ActionResult<string>> {
    const check = this.validateLogo(file);
    if (!check.ok) {
      return of(check as ActionResult<string>);
    }

    if (!this.store.remote()) {
      return from(readDataUri(file)).pipe(map((uri) => ({ ok: true, value: uri })));
    }

    return this.api.uploadLogo(file).pipe(
      map((url) => ({ ok: true, value: url }) as ActionResult<string>),
      catchError((error: HttpErrorResponse) =>
        of(
          apiErrorResult(error, {
            invalid_logo_size: 'settings.error.logoSize',
            invalid_logo_type: 'settings.error.logoType',
          }),
        ),
      ),
    );
  }

  /**
   * Contrôle du fichier choisi, avant de le placer dans le brouillon. Le logo
   * est ensuite stocké en data URI : il suit la facture jusqu'au PDF.
   */
  validateLogo(file: File): ActionResult {
    if (file.type && !LOGO_TYPES.includes(file.type)) {
      return { ok: false, errorKey: 'settings.error.logoType' };
    }
    if (file.size > MAX_LOGO_BYTES) {
      return { ok: false, errorKey: 'settings.error.logoSize' };
    }
    return { ok: true };
  }

  /** Numéro qu'attribuerait la série pour le préfixe en cours de saisie. */
  nextNumberFor(prefix: string): string {
    return this.store.peekNumberFor(prefix.trim().toUpperCase() || '—');
  }
}
