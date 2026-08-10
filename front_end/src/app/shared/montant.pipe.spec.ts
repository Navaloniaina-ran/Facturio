import { MontantPipe } from './montant.pipe';

/** Les espaces produites par Intl varient selon la version d'ICU : on les normalise. */
const normaliser = (valeur: string) => valeur.replace(/\s/gu, ' ');

describe('MontantPipe', () => {
  const pipe = new MontantPipe();

  it('formate un montant entier sans décimale', () => {
    expect(normaliser(pipe.transform(1500))).toBe('1 500 €');
  });

  it('conserve les centimes quand ils existent', () => {
    expect(normaliser(pipe.transform(1080.5))).toBe('1 080,50 €');
  });

  it('traite null comme zéro', () => {
    expect(normaliser(pipe.transform(null))).toBe('0 €');
  });

  it('respecte la devise de l’espace de travail', () => {
    expect(pipe.transform(1000, 'USD')).toContain('$');
  });
});
