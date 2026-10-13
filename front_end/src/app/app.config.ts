import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from './core/auth.service';
import { apiEnvelopeInterceptor } from './core/api/api-envelope.interceptor';
import { httpErrorInterceptor } from './core/http-error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Une seule couche HTTP dans le projet, avec traduction des erreurs API.
    provideHttpClient(withFetch(), withInterceptors([apiEnvelopeInterceptor, httpErrorInterceptor])),
    // La session du cookie est reprise avant le premier rendu : les gardes de
    // route voient donc l'utilisateur déjà connecté, sans passage par l'écran
    // de connexion. Le rendu serveur n'a pas de cookie à interroger.
    provideAppInitializer(() =>
      isPlatformBrowser(inject(PLATFORM_ID)) ? inject(AuthService).restore() : of(true),
    ),
  ],
};
