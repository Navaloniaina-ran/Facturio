import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { httpErrorKey } from './api/api-error';
import { AuthService } from './auth.service';
import { I18nService } from './i18n/i18n.service';
import { ToastService } from './toast.service';

export { httpErrorKey };

/**
 * Traduit les erreurs de l'API en messages lisibles. Le front ne décide de
 * rien : l'autorisation, la propriété des données et la validation restent
 * l'affaire du backend. Sur 401, la session locale est fermée.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);
  const i18n = inject(I18nService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const apiRequest =
    request.url.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  // La reprise de session interroge l'API sans identité : un 401 y est une
  // réponse normale, pas une erreur à signaler.
  const publicAuthRequest = ['/api/auth/login', '/api/auth/signup', '/api/auth/session'].includes(
    request.url,
  );
  const headers: Record<string, string> = {};
  if (apiRequest) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  const token = auth.accessToken();
  if (request.url.startsWith('/api/') && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const securedRequest = Object.keys(headers).length
    ? request.clone({ setHeaders: headers })
    : request;

  return next(securedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Le mode hors ligne est géré par l'appelant : pas de toast pour un statut 0.
      if (error.status !== 0 && !publicAuthRequest) {
        toasts.error(i18n.t(httpErrorKey(error.status)));
      }

      if (error.status === 401 && !publicAuthRequest) {
        auth.signOut(false);
        void router.navigate(['/createurs/connexion']);
      }

      return throwError(() => error);
    }),
  );
};
