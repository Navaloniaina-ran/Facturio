import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { DICTIONARY } from './translations';

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
  });

  it('defaults to French', () => {
    expect(i18n.language()).toBe('fr');
    expect(i18n.locale()).toBe('fr-FR');
  });

  it('switches to English and keeps the choice', () => {
    i18n.setLanguage('en');

    expect(i18n.locale()).toBe('en-US');
    expect(localStorage.getItem('facturio.language')).toBe('en');
  });

  it('translates a key in both languages', () => {
    expect(i18n.t('kpi.collected')).toBe('Encaissé');

    i18n.setLanguage('en');
    expect(i18n.t('kpi.collected')).toBe('Collected');
  });

  it('replaces the parameters of a message', () => {
    expect(i18n.t('shell.greeting', { name: 'Toky' })).toBe('Bonjour Toky');
  });

  it('returns the key itself when it is unknown', () => {
    expect(i18n.t('does.not.exist')).toBe('does.not.exist');
  });

  it('translates statuses, deliverables and payment methods', () => {
    expect(i18n.status('PARTIALLY_PAID')).toBe('Partiellement payée');
    expect(i18n.deliverable('VIDEO')).toBe('Vidéo');
    expect(i18n.method('MOBILE_MONEY')).toBe('Mobile money');
  });

  it('serves the workspace vocabulary', () => {
    expect(i18n.vocab('clients')).toBe('Marques');
    expect(i18n.vocab('clients', 'BUSINESS')).toBe('Clients');
  });

  it('composes a quota message with the upgrade path', () => {
    const message = i18n.error({
      errorKey: 'quota.limit',
      params: {
        plan: 'FREE',
        limit: 3,
        item: 'quota.item.brands',
        nextPlan: 'PRO',
        nextLimit: 50,
      },
    });

    expect(message).toContain('votre offre FREE autorise 3 marques');
    expect(message).toContain('L’offre PRO en autorise 50');
  });

  it('returns null when the action carries no error', () => {
    expect(i18n.error({ ok: true } as { errorKey?: string })).toBeNull();
  });

  it('holds both languages for every key', () => {
    for (const [key, entry] of Object.entries(DICTIONARY)) {
      expect(entry.length, key).toBe(2);
      expect(entry[0].length, key).toBeGreaterThan(0);
      expect(entry[1].length, key).toBeGreaterThan(0);
    }
  });
});
