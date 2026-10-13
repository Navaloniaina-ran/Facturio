import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « header » : titre du document, numéro et dates. */
@Component({
  selector: 'app-invoice-header',
  template: `
    <div [class]="align()" [style.padding.px]="settings().page.padding">
      <p class="text-lg font-semibold tracking-tight" [style.color]="settings().theme.primaryColor">
        {{ block().settings.title || 'FACTURE' }}
      </p>
      <p class="mt-0.5 font-medium">{{ data().number }}</p>
      <p class="opacity-70">Émise le {{ data().issueDate }} · Échéance {{ data().dueDate }}</p>
    </div>
  `,
})
export class InvoiceHeaderComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
