import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « footer » : mentions de bas de page. */
@Component({
  selector: 'app-invoice-footer',
  template: `
    <div
      [class]="align()"
      [style.padding.px]="settings().page.padding"
      [style.borderTop]="'1px solid ' + settings().theme.borderColor"
    >
      <p class="text-[0.7rem] opacity-60">{{ block().settings.text || data().footer }}</p>
    </div>
  `,
})
export class InvoiceFooterComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
