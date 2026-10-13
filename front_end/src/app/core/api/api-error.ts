import { HttpErrorResponse } from '@angular/common/http';
import { ActionResult } from '../models';

/** Clé de traduction correspondant au statut HTTP. */
export function httpErrorKey(status: number): string {
  switch (status) {
    case 400:
      return 'http.error.400';
    case 401:
      return 'http.error.401';
    case 403:
      return 'http.error.403';
    case 404:
      return 'http.error.404';
    case 409:
      return 'http.error.409';
    case 0:
      return 'http.error.offline';
    default:
      return 'http.error.unknown';
  }
}

interface ApiErrorBody {
  code?: string;
}

/** Code métier renvoyé par le backend, quand il en publie un. */
export function apiErrorCode(error: HttpErrorResponse): string | null {
  return (error.error as ApiErrorBody | null)?.code ?? null;
}

/**
 * Traduit un échec d'appel en résultat d'action. `codes` permet à chaque écran
 * de donner sa propre phrase aux erreurs métier qu'il sait interpréter — par
 * exemple `brand_has_documents` pour une marque encore rattachée à une facture.
 */
export function apiErrorResult(
  error: HttpErrorResponse,
  codes: Record<string, string> = {},
): ActionResult<never> {
  const code = apiErrorCode(error);
  const errorKey = (code && codes[code]) || httpErrorKey(error.status);
  return { ok: false, errorKey };
}
