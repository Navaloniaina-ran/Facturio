import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

/** Enveloppe commune renvoyée par le backend : { status, message, data }. */
interface ApiEnvelope {
  status: number;
  message: string;
  data?: unknown;
}

function isEnvelope(body: unknown): body is ApiEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ApiEnvelope).status === 'number' &&
    'message' in body &&
    'data' in body
  );
}

/**
 * Déballe les réponses { status, message, data } de l'API : le reste du front reçoit
 * la charge utile directement. Pour les erreurs, le code métier (data.code) est remonté
 * dans `error.error.code`, à l'endroit où les écrans le lisent déjà.
 */
export const apiEnvelopeInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  return next(request).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && isEnvelope(event.body)) {
        return event.clone({ body: event.body.data ?? null });
      }
      return event;
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isEnvelope(error.error)) {
        const data = error.error.data as { code?: string } | null | undefined;
        return throwError(
          () =>
            new HttpErrorResponse({
              error: { code: data?.code, message: error.error.message },
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? undefined,
            }),
        );
      }
      return throwError(() => error);
    }),
  );
};
