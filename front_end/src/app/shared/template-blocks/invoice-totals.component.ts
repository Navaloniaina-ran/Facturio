import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs } from './template-block.contract';

/** Bloc « totaux » : sous-total, TVA ventilée, total, acompte et reste à payer. */
@Component({
  selector: 'app-invoice-totals',
  template: `
    <div class="flex" [class]="justify()" [style.padding.px]="settings().page.padding">
      <dl class="min-w-56 space-y-1">
        <div class="flex justify-between gap-6">
          <dt class="opacity-70">{{ data().subtotalLabel }}</dt>
          <dd>{{ data().subtotal }}</dd>
        </div>

        @if (block().settings.showVatBreakdown) {
          @for (vat of data().vatLines; track vat.label) {
            <div class="flex justify-between gap-6">
              <dt class="opacity-70">{{ vat.label }}</dt>
              <dd>{{ vat.amount }}</dd>
            </div>
          }
        }

        <div
          class="flex justify-between gap-6 pt-1 font-semibold"
          [style.borderTop]="'1px solid ' + settings().theme.borderColor"
          [style.color]="settings().theme.primaryColor"
        >
          <dt>{{ data().totalLabel }}</dt>
          <dd>{{ data().total }}</dd>
        </div>

        @if (block().settings.showDeposit) {
          <div class="flex justify-between gap-6">
            <dt class="opacity-70">Acompte</dt>
            <dd>{{ data().deposit }}</dd>
          </div>
        }

        @if (block().settings.showOutstanding) {
          <div class="flex justify-between gap-6 font-semibold">
            <dt>Reste à payer</dt>
            <dd>{{ data().outstanding }}</dd>
          </div>
        }
      </dl>
    </div>
  `,
})
export class InvoiceTotalsComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly justify = computed(() => {
    const alignment = this.block().settings.alignment;
    if (alignment === 'left') {
      return 'justify-start';
    }
    return alignment === 'center' ? 'justify-center' : 'justify-end';
  });
}
