import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Settings } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceView } from '../../pages/invoices/invoice.service';
import { AmountPipe } from '../amount.pipe';
import { LocalDatePipe } from '../local-date.pipe';

/**
 * Aperçu de la facture, tel qu'il sera imprimé. Le bouton d'impression
 * ouvre la boîte de dialogue du navigateur, qui permet d'enregistrer en PDF —
 * en production, le même gabarit est rendu côté serveur par le moteur HTML→PDF.
 */
@Component({
  selector: 'app-invoice-preview',
  imports: [AmountPipe, LocalDatePipe],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.css',
})
export class InvoicePreviewComponent {
  private readonly store = inject(WorkspaceStore);
  protected readonly i18n = inject(I18nService);

  readonly invoice = input.required<InvoiceView>();

  /**
   * Paramètres à utiliser pour l'en-tête et les mentions. Par défaut ceux de
   * l'espace ; l'écran Paramètres passe son brouillon pour montrer, avant
   * enregistrement, le résultat de ce qui vient d'être changé.
   */
  readonly draftSettings = input<Settings | null>(null, { alias: 'settings' });

  /** Un aperçu illustratif n'apporte ni barre d'impression ni zone imprimable. */
  readonly actions = input(true);

  protected readonly settings = computed(() => this.draftSettings() ?? this.store.settings());
  protected readonly accentStyle = computed(() => `--accent: ${this.settings().accentColor}`);

  /** Un avoir porte son propre intitulé et son propre montant. */
  protected readonly isCreditNote = computed(() => this.invoice().kind === 'CREDIT_NOTE');

  protected readonly documentTitle = computed(() =>
    this.i18n.t(this.isCreditNote() ? 'preview.creditNote' : 'preview.invoice'),
  );

  protected lineNet(line: { quantity: number; unitPrice: number }): number {
    return line.quantity * line.unitPrice;
  }

  protected print(): void {
    window.print();
  }
}
