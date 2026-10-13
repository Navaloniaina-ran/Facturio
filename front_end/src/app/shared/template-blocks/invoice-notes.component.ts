import { Component, computed, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Bloc « notes » : texte libre, saisi dans le panneau de propriétés. */
@Component({
  selector: 'app-invoice-notes',
  template: `
    <div [class]="align()" [style.padding.px]="settings().page.padding">
      <!-- Titre facultatif : sans lui, les modèles existants gardent leur
           note nue, telle qu'ils l'affichaient jusqu'ici. -->
      @if (block().settings.title) {
        <p class="text-[0.65rem] font-semibold uppercase opacity-60">
          {{ block().settings.title }}
        </p>
      }
      <p class="opacity-80" [class.mt-1]="block().settings.title">
        {{ block().settings.text || data().notes }}
      </p>
    </div>
  `,
})
export class InvoiceNotesComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly align = computed(() => alignmentClass(this.block().settings.alignment));
}
