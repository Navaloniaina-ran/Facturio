/**
 * Le front affiche un pays en toutes lettres, la facture électronique exige un
 * code ISO 3166-1 alpha-2. La correspondance vit ici, pas dans les écrans.
 */
export const COUNTRY_CODES: Record<string, string> = {
  France: 'FR',
  Madagascar: 'MG',
  Belgique: 'BE',
  Suisse: 'CH',
  Canada: 'CA',
  Sénégal: 'SN',
};

/** Code ISO d'un pays saisi en toutes lettres, France par défaut. */
export function countryCodeOf(country: string): string {
  return COUNTRY_CODES[country] ?? 'FR';
}

/** Libellé d'un code ISO ; un code inconnu est rendu tel quel. */
export function countryNameOf(code: string | null | undefined): string {
  if (!code) {
    return 'France';
  }
  const match = Object.entries(COUNTRY_CODES).find(([, value]) => value === code);
  return match ? match[0] : code;
}
