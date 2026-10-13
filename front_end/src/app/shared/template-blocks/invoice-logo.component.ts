import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs } from './template-block.contract';

/** Bloc « logo » : image téléversée sur le backend, largeur et alignement réglables. */
@Component({
  selector: 'app-invoice-logo',
  template: `
    <div class="flex" [class]="justify()" [style.padding.px]="settings().page.padding">
      @if (data().company.logoUrl) {
        <img
          [src]="data().company.logoUrl"
          [style.width.px]="block().settings.logoWidth || 140"
          class="h-auto object-contain"
          alt=""
        />
      } @else {
        <div
          class="grid place-items-center rounded-lg text-xs opacity-60"
          [style.width.px]="block().settings.logoWidth || 140"
          [style.height.px]="48"
          [style.border]="'1px dashed ' + settings().theme.borderColor"
        >
          Logo
        </div>
      }
    </div>
  `,
})
export class InvoiceLogoComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly justify = computed(() => {
    const alignment = this.block().settings.alignment;
    if (alignment === 'center') {
      return 'justify-center';
    }
    return alignment === 'right' ? 'justify-end' : 'justify-start';
  });
}
