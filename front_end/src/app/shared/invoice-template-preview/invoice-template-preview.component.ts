import { Component, computed, input } from '@angular/core';
import { InvoiceTemplateDocument } from '../../core/templates/invoice-template.models';
import { SAMPLE_INVOICE, SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockHostComponent } from '../template-blocks/template-block-host.component';

/**
 * Aperçu du modèle sur une facture fictive. Il se met à jour immédiatement :
 * il ne lit que le JSON local, sans jamais appeler le backend.
 */
@Component({
  selector: 'app-invoice-template-preview',
  imports: [TemplateBlockHostComponent],
  templateUrl: './invoice-template-preview.component.html',
  styleUrl: './invoice-template-preview.component.css',
})
export class InvoiceTemplatePreviewComponent {
  readonly document = input.required<InvoiceTemplateDocument>();
  /** Données affichées : la facture fictive par défaut. */
  readonly data = input<SampleInvoice>(SAMPLE_INVOICE);
  /** Vignette : version réduite, non interactive, pour la liste des modèles. */
  readonly thumbnail = input(false);

  protected readonly visibleBlocks = computed(() =>
    this.document().blocks.filter((block) => block.visible),
  );

  protected readonly sheetStyle = computed(() => {
    const { theme, page } = this.document().settings;
    return {
      color: theme.textColor,
      fontFamily: `${theme.fontFamily}, ui-sans-serif, system-ui, sans-serif`,
      fontSize: `${theme.fontSize}px`,
      fontWeight: String(theme.fontWeight),
      padding: `${page.margin}mm`,
      border: page.border ? `1px solid ${theme.borderColor}` : 'none',
      borderRadius: `${page.borderRadius}px`,
    };
  });
}
