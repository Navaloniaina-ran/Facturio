import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Language } from '../../core/i18n/translations';

/** Sélecteur de langue FR / EN, disponible sur les tunnels d'accès et dans l'espace. */
@Component({
  selector: 'app-language-switch',
  templateUrl: './language-switch.component.html',
})
export class LanguageSwitchComponent {
  protected readonly i18n = inject(I18nService);

  /** « light » sur fond clair, « dark » sur la navigation sombre. */
  readonly variant = input<'light' | 'dark'>('light');

  protected select(language: Language): void {
    this.i18n.setLanguage(language);
  }

  protected buttonClasses(language: Language): string {
    const active = this.i18n.language() === language;

    if (this.variant() === 'dark') {
      return active ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white';
    }
    return active ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900';
  }
}
