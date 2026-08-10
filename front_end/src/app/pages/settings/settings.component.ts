import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { Settings } from '../../core/models';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { SettingsService } from './settings.service';

const CURRENCIES = ['EUR', 'USD', 'MGA', 'XOF'];

/**
 * Paramètres de l'espace : tout ce qui ne se règle qu'une fois — identité,
 * logo, numérotation, conditions et mentions légales. La TVA n'y figure pas :
 * elle se décide document par document.
 */
@Component({
  selector: 'app-settings',
  imports: [FormsModule, LanguageSwitchComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(SettingsService);

  protected readonly currencies = CURRENCIES;
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Copie de travail : rien n'est appliqué avant enregistrement. */
  protected form: Settings = { ...this.service.current() };

  protected save(): void {
    const result = this.service.save(this.form);

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.error.set(null);
    this.message.set(this.i18n.t('settings.flash.saved'));
  }

  /** Le logo part en data URI : il suit la facture jusqu'au PDF. */
  protected pickLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = this.service.setLogo(String(reader.result), file.size);

      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }
      this.error.set(null);
      this.form = { ...this.service.current() };
      this.message.set(this.i18n.t('settings.flash.logo'));
    };
    reader.readAsDataURL(file);
  }

  protected removeLogo(): void {
    this.service.removeLogo();
    this.form = { ...this.service.current() };
  }
}
