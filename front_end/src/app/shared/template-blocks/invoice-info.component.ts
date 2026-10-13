import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « informations » : coordonnées de l'émetteur. */
@Component({
  selector: 'app-invoice-info',
  template: `
    <div [class]="align()" [style.padding.px]="settings().page.padding">
      @if (block().settings.showLabels) {
        <p class="text-[0.65rem] font-semibold uppercase opacity-60">
          {{ block().settings.title || 'Émetteur' }}
        </p>
      }
      <p class="mt-1 font-semibold">{{ data().company.name }}</p>
      <p class="opacity-80">{{ data().company.address }}</p>
      <p class="opacity-60">{{ data().company.taxId }}</p>
    </div>
  `,
})
export class InvoiceInfoComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
