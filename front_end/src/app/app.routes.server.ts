import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * L'espace créateur dépend de la session du navigateur : il est rendu côté
 * client. Les tunnels d'accès publics sont pré-rendus.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'createurs/connexion', renderMode: RenderMode.Prerender },
  { path: 'createurs/inscription', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
