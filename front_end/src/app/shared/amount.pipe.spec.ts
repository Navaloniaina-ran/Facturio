import { TestBed } from '@angular/core/testing';
import { I18nService } from '../core/i18n/i18n.service';
import { AmountPipe } from './amount.pipe';

/** Les espaces produites par Intl varient selon la version d'ICU. */
const normalise = (value: string) => value.replace(/\s/gu, ' ');

describe('AmountPipe', () => {
  let pipe: AmountPipe;
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [AmountPipe] });
    pipe = TestBed.inject(AmountPipe);
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
  });

  it('formats a whole amount without decimals', () => {
    expect(normalise(pipe.transform(1500))).toBe('1 500 €');
  });

  it('keeps cents when they exist', () => {
    expect(normalise(pipe.transform(1080.5))).toBe('1 080,50 €');
  });

  it('treats null as zero', () => {
    expect(normalise(pipe.transform(null))).toBe('0 €');
  });

  it('follows the selected language', () => {
    i18n.setLanguage('en');
    expect(normalise(pipe.transform(1500))).toBe('€1,500');
  });

  it('accepts an explicit currency', () => {
    expect(pipe.transform(1000, 'USD')).toContain('$');
  });
});
