import { TestBed } from '@angular/core/testing';
import { I18nService } from '../core/i18n/i18n.service';
import { LocalDatePipe } from './local-date.pipe';

describe('LocalDatePipe', () => {
  let pipe: LocalDatePipe;
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [LocalDatePipe] });
    pipe = TestBed.inject(LocalDatePipe);
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
  });

  it('formats a date the French way', () => {
    expect(pipe.transform('2026-08-12')).toBe('12/08/2026');
  });

  it('formats a date the English way', () => {
    i18n.setLanguage('en');
    expect(pipe.transform('2026-08-12')).toBe('08/12/2026');
  });

  it('supports the day and month only style', () => {
    expect(pipe.transform('2026-08-12', 'dayMonth')).toBe('12/08');
  });

  it('renders a dash when the date is missing', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});
