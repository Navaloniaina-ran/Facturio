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
  remind:
    'M12 2a6 6 0 0 0-6 6v5l-2 3h16l-2-3V8a6 6 0 0 0-6-6zm-3 18h6a3 3 0 0 1-6 0z',
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
  close: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm4.2 6.2-5 5-2.4-2.4-1.4 1.4 3.8 3.8 6.4-6.4z',
  quote: 'M6 2h8l4 4v16H6V2zm2 8h8v2H8v-2zm0 4h5v2H8v-2z',
  invoice: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2V2zm3 5h8v2H8V7zm0 4h8v2H8v-2z',
} as const;

export type IconName = keyof typeof ICONS;
