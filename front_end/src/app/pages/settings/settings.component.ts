import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { Settings } from '../../core/models';
import { InvoicePreviewComponent } from '../../shared/invoice-preview/invoice-preview.component';
import { sampleInvoiceView } from '../../shared/invoice-preview/sample-invoice';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { SettingsService } from './settings.service';

const CURRENCIES = ['EUR', 'USD', 'MGA', 'XOF'];

/**
 * Paramètres de l'espace : tout ce qui ne se règle qu'une fois — identité,
 * logo, numérotation, conditions et mentions légales. La TVA n'y figure pas :
 * elle se décide document par document.
 *
 * Le brouillon vit dans un signal, ce qui permet à l'aperçu placé à côté de
 * montrer le résultat de chaque changement avant même l'enregistrement.
 */
@Component({
  selector: 'app-settings',
  imports: [FormsModule, LanguageSwitchComponent, InvoicePreviewComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(SettingsService);

  protected readonly currencies = CURRENCIES;
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Brouillon : rien n'est appliqué avant enregistrement, logo compris. */
  protected readonly form = signal<Settings>({ ...this.service.current() });
  protected readonly dirty = signal(false);

  /** Survol de la zone de dépôt, pour le retour visuel du glisser-déposer. */
  protected readonly dragging = signal(false);

  /** Numéros annoncés sous chaque préfixe, recalculés à la frappe. */
  protected readonly nextInvoiceNumber = computed(() =>
    this.service.nextNumberFor(this.form().invoicePrefix),
  );
  protected readonly nextQuoteNumber = computed(() =>
    this.service.nextNumberFor(this.form().quotePrefix),
  );
  protected readonly nextCreditNumber = computed(() =>
    this.service.nextNumberFor(this.form().creditPrefix),
  );

  /** Facture d'exemple : elle suit le brouillon, préfixe et conditions inclus. */
  protected readonly sample = computed(() =>
    sampleInvoiceView({
      number: this.nextInvoiceNumber(),
      brandName: this.i18n.t('settings.sample.brand'),
      brandEmail: this.i18n.t('settings.sample.email'),
      campaignName: this.i18n.t('settings.sample.campaign'),
      firstLine: this.i18n.t('settings.sample.line1'),
      secondLine: this.i18n.t('settings.sample.line2'),
      terms: this.form().defaultTerms,
    }),
  );

  /** Écriture d'un champ du brouillon, typée sur le modèle. */
  protected patch<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
    this.message.set(null);
    this.dirty.set(true);
  }

  protected save(): void {
    this.service.save(this.form()).subscribe((result) => {
      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }

      this.error.set(null);
      this.dirty.set(false);
      this.form.set({ ...this.service.current() });
      this.message.set(this.i18n.t('settings.flash.saved'));
    });
  }

  /** Retour aux paramètres enregistrés : le brouillon est abandonné. */
  protected revert(): void {
    this.form.set({ ...this.service.current() });
    this.dirty.set(false);
    this.error.set(null);
    this.message.set(null);
  }

  protected chooseLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.useLogo(input.files?.[0]);
    // Vidé pour que choisir deux fois le même fichier déclenche bien l'aperçu.
    input.value = '';
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  /** Passer d'un enfant à l'autre de la zone ne compte pas comme en sortir. */
  protected endDrag(event: DragEvent): void {
    const zone = event.currentTarget as HTMLElement;
    if (!zone.contains(event.relatedTarget as Node | null)) {
      this.dragging.set(false);
    }
  }

  protected dropLogo(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.useLogo(event.dataTransfer?.files?.[0]);
  }

  protected removeLogo(): void {
    this.patch('logo', null);
  }

  private useLogo(file: File | undefined): void {
    if (!file) {
      return;
    }

    this.service.prepareLogo(file).subscribe((result) => {
      if (!result.ok || !result.value) {
        this.error.set(this.i18n.error(result));
        return;
      }

      this.error.set(null);
      this.patch('logo', result.value);
      this.message.set(this.i18n.t('settings.flash.logo'));
    });
  }
}
