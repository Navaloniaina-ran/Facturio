import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « paiement » : conditions de règlement et coordonnées bancaires. */
@Component({
  selector: 'app-invoice-payment',
  template: `
    <div
      [class]="align()"
      [style.padding.px]="settings().page.padding"
      [style.background]="settings().theme.secondaryColor"
      [style.borderRadius.px]="settings().page.borderRadius"
    >
      <p class="text-[0.65rem] font-semibold uppercase opacity-60">
        {{ block().settings.title || 'Paiement' }}
      </p>
      <p class="mt-1">{{ data().paymentTerms }}</p>
      @if (block().settings.showBankDetails) {
        <p class="mt-1 font-mono text-[0.7rem]">{{ data().bankDetails }}</p>
      }
    </div>
  `,
})
export class InvoicePaymentComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
