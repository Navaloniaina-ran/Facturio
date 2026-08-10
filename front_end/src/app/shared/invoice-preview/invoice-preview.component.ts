import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
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

  protected readonly settings = this.store.settings.asReadonly();
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
