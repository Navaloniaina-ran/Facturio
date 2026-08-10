import { Injectable, computed, signal } from '@angular/core';
import { WorkspaceType } from '../models';
import { DICTIONARY, LANGUAGES, Language } from './translations';

const STORAGE_KEY = 'facturio.language';

/**
 * Traduction de l'interface. Les gabarits appellent `t()` pendant leur
 * évaluation : la lecture du signal `language` y est donc suivie par Angular,
 * et changer de langue rafraîchit toute l'application.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly current = signal<Language>(this.readStored());

  readonly language = this.current.asReadonly();
  readonly available = LANGUAGES;
  readonly locale = computed(() => (this.current() === 'fr' ? 'fr-FR' : 'en-US'));

  setLanguage(language: Language): void {
    this.current.set(language);

    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    } catch {
      // Rendu serveur : la langue reste en mémoire.
    }
  }

  /** Traduit une clé et remplace les paramètres `{nom}`. */
  t(key: string, params?: Record<string, string | number>): string {
    const entry = DICTIONARY[key as keyof typeof DICTIONARY];
    if (!entry) {
      return key;
    }

    const text: string = entry[this.current() === 'fr' ? 0 : 1];
    if (!params) {
      return text;
    }

    return Object.entries(params).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      text,
    );
  }

  /**
   * Message d'erreur d'une action métier. Les services renvoient une clé et
   * ses paramètres ; le cas particulier du quota compose deux phrases.
   */
  error(result: { errorKey?: string; params?: Record<string, string | number> }): string | null {
    if (!result.errorKey) {
      return null;
    }
    if (result.errorKey === 'quota.limit') {
      return this.quotaMessage(result.params ?? {});
    }
    return this.t(result.errorKey, result.params);
  }

  private quotaMessage(params: Record<string, string | number>): string {
    const reached = this.t('quota.limit', { ...params, item: this.t(String(params['item'])) });
    const nextPlan = params['nextPlan'];
    if (!nextPlan) {
      return reached;
    }

    const nextLimit = params['nextLimit'];
    return `${reached} ${this.t('quota.upgrade', {
      plan: String(nextPlan),
      limit: nextLimit === '' ? this.t('common.unlimited') : nextLimit,
    })}`;
  }

  status(code: string): string {
    return this.t(`status.${code}`);
  }

  deliverable(type: string): string {
    return this.t(`deliverable.${type}`);
  }

  method(code: string): string {
    return this.t(`method.${code}`);
  }

  stage(code: string): string {
    return this.t(`stage.${code}`);
  }

  collaborationType(code: string): string {
    return this.t(`collabType.${code}`);
  }

  /** Libellé métier dépendant du type d'espace de travail. */
  vocab(key: string, workspace: WorkspaceType = 'CREATOR'): string {
    return this.t(`vocab.${workspace}.${key}`);
  }

  /** Mois abrégé dans la langue courante, pour les graphiques. */
  monthShort(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'short' }).format(date);
  }

  /** Mois et année en clair, pour l'en-tête. */
  monthYear(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(date);
  }

  private readStored(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'en' || stored === 'fr' ? stored : 'fr';
    } catch {
      return 'fr';
    }
  }
}
