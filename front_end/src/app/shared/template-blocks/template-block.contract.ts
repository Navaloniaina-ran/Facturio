import { InputSignal } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';

/**
 * Contrat commun des blocs de facture : chacun est piloté par le JSON du
 * modèle et ne connaît que trois entrées. Aucun bloc ne calcule quoi que ce
 * soit : il met en forme les données qu'on lui donne.
 */
export interface TemplateBlockInputs {
  block: InputSignal<InvoiceTemplateBlock>;
  settings: InputSignal<InvoiceTemplateSettings>;
  data: InputSignal<SampleInvoice>;
}

/** Traduit l'alignement du modèle en classe utilitaire. */
export function alignmentClass(alignment: string | undefined): string {
  if (alignment === 'center') {
    return 'text-center';
  }
  return alignment === 'right' ? 'text-right' : 'text-left';
}
