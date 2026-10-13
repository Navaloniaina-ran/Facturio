/**
 * Jeu d'icônes de l'application, tracées à la main en 24×24 pour rester
 * lisibles à petite taille et éviter toute dépendance externe.
 */
export const ICONS = {
  view: 'M12 5C6.5 5 3 12 3 12s3.5 7 9 7 9-7 9-7-3.5-7-9-7zm0 10.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  edit: 'M4 20h4l10-10-4-4L4 16v4zm12.7-12.7 1.6-1.6a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.6 1.6 4 4z',
  delete:
    'M9 4h6l1 2h4v2H4V6h4l1-2zM6 9h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z',
  send: 'M3 20l18-8L3 4v6l12 2-12 2v6z',
  mail: 'M3 5h18v14H3V5zm2 2 7 4.5L19 7H5zm0 2.3V17h14V9.3l-7 4.4-7-4.4z',
  payment: 'M2 6h20v12H2V6zm2 2v8h16V8H4zm3 2h6v2H7v-2z',
  remind: 'M12 2a6 6 0 0 0-6 6v5l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-3 18h6a3 3 0 0 1-6 0z',
  duplicate:
    'M8 3h9a2 2 0 0 1 2 2v11h-2V5H8V3zM5 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
  creditNote: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2V2zm3 9h8v2H8v-2z',
  details: 'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z',
  accept: 'M9.5 17.5 4 12l1.4-1.4 4.1 4.1 8.6-8.6L19.5 7.5z',
  refuse:
    'M6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z',
  convert: 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z',
  pause: 'M8 5h3v14H8V5zm5 0h3v14h-3V5z',
  resume: 'M8 5l11 7-11 7z',
  postpone: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 5v4.6l3.5 2-1 1.7-4.5-2.6V8h2z',
  template: 'M6 2h8l4 4v16H6V2zm2 8h8v2H8v-2zm0 4h8v2H8v-2z',
  print: 'M7 3h10v4H7V3zM5 8h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2zm4 8h6v3H9v-3z',
  contract: 'M6 2h9l4 4v16H6V2zm3 9h8v2H9v-2zm0 4h6v2H9v-2z',
  campaigns: 'M4 10v4l10 4V6zm12-2h4v8h-4z',
  xml: 'M8.7 6.3 3 12l5.7 5.7 1.4-1.4L5.8 12l4.3-4.3zm6.6 0-1.4 1.4L18.2 12l-4.3 4.3 1.4 1.4L21 12z',
  close: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm4.2 6.2-5 5-2.4-2.4-1.4 1.4 3.8 3.8 6.4-6.4z',
  quote: 'M6 2h8l4 4v16H6V2zm2 8h8v2H8v-2zm0 4h5v2H8v-2z',
  invoice: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2V2zm3 5h8v2H8V7zm0 4h8v2H8v-2z',

  // Signes d'interface : ils remplacent les glyphes ✓ ✕ → ○ qui traînaient
  // dans les gabarits et dont le dessin dépendait de la police du système.
  check: 'M9.6 16.2 4.8 11.4l1.4-1.4 3.4 3.4 7.2-7.2 1.4 1.4z',
  dismiss:
    'M6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z',
  arrowRight: 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z',
  /** Étiquette : emblème de la page Marques / Clients. */
  brandTag:
    'M11 2H4a2 2 0 0 0-2 2v7l11 11 9-9L11 2zM7.5 9A1.5 1.5 0 1 1 9 7.5 1.5 1.5 0 0 1 7.5 9z',
  /** Chevrons de tri d'une colonne de tableau. */
  sortAsc: 'M12 7l5 6H7z',
  sortDesc: 'M12 17l-5-6h10z',
  /** Loupe du champ de recherche des listes. */
  search:
    'M10 3a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 10 3zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  /** Trois points : ouvre les actions secondaires d'une ligne. */
  more: 'M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  /** Corbeille vide : repère des états sans contenu. */
  inbox: 'M4 4h16v10h-5a3 3 0 0 1-6 0H4V4zm0 12h3.4a5 5 0 0 0 9.2 0H20v4H4v-4z',
} as const;

export type IconName = keyof typeof ICONS;

/**
 * Icônes de la navigation latérale. Séparées des icônes d'action parce
 * qu'elles répondent à une autre question — « où suis-je ? » plutôt que
 * « que puis-je faire ? » — mais tracées dans le même fichier pour qu'un
 * seul endroit fasse foi.
 */
export const NAV_ICONS = {
  dashboard: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
  brands: 'M12 3l2.6 5.6 6.1.8-4.5 4.3 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z',
  campaigns: 'M4 10v4l10 4V6zm12-2h4v8h-4z',
  quotes: 'M6 2h8l4 4v16H6zm2 8h8v2H8zm0 4h8v2H8z',
  invoices: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zm3 5h8v2H8zm0 4h8v2H8z',
  payments: 'M2 6h20v4H2zm0 6h20v6H2zm2 2h6v2H4z',
  reminders: 'M12 2a6 6 0 0 0-6 6v5l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-3 18h6a3 3 0 0 1-6 0z',
  reports: 'M4 20h4V10H4zm6 0h4V4h-4zm6 0h4v-7h-4z',
  collaborations:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5v1H3v-1zm14 1v-1c0-1.5-.6-2.8-1.6-3.7 2.7.2 4.6 1.7 4.6 3.7v1h-3z',
  templates: 'M4 3h16v18H4V3zm2 2v4h12V5H6zm0 6v8h5v-8H6zm7 0v8h5v-8h-5z',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm9-2-2-.5a7 7 0 0 0-.6-1.5l1.1-1.7-1.4-1.4-1.7 1.1a7 7 0 0 0-1.5-.6L14.5 3h-2l-.5 2a7 7 0 0 0-1.5.6L8.8 4.5 7.4 5.9 8.5 7.6a7 7 0 0 0-.6 1.5L6 9.6v2l1.9.5a7 7 0 0 0 .6 1.5L7.4 15.3l1.4 1.4 1.7-1.1a7 7 0 0 0 1.5.6l.5 2h2l.5-2a7 7 0 0 0 1.5-.6l1.7 1.1 1.4-1.4-1.1-1.7a7 7 0 0 0 .6-1.5l1.9-.5v-2z',
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

/**
 * Table de correspondance unique, tous jeux confondus. L'en-tête de page
 * y puise sans avoir à savoir si l'emblème vient de la navigation ou des
 * actions. Les clés communes aux deux jeux tracent le même chemin.
 */
export const ALL_ICONS = { ...NAV_ICONS, ...ICONS } as const;

export type AnyIconName = keyof typeof ALL_ICONS;
