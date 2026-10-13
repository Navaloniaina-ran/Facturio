import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « client » : à qui la facture est adressée. */
@Component({
  selector: 'app-invoice-customer',
  template: `
    <div [class]="align()" [style.padding.px]="settings().page.padding">
      @if (block().settings.showLabels) {
        <p class="text-[0.65rem] font-semibold uppercase opacity-60">
          {{ block().settings.title || 'Facturé à' }}
        </p>
      }
      <p class="mt-1 font-semibold">{{ data().customer.name }}</p>
      <p class="opacity-80">{{ data().customer.address }}</p>
      <p class="opacity-60">{{ data().customer.email }}</p>
    </div>
  `,
})
export class InvoiceCustomerComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
