import { Component, computed, input } from '@angular/core';
import {
  DEFAULT_ITEMS_COLUMNS,
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
  ItemsColumn,
  ItemsColumnKey,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice, SampleInvoiceLine } from '../../core/templates/sample-invoice';
import { TemplateBlockInputs, alignmentClass } from './template-block.contract';

/** Intitulés des colonnes, dans la langue du document. */
const COLUMN_LABELS: Record<ItemsColumnKey, string> = {
  description: 'Description',
  quantity: 'Qté',
  unitPrice: 'Prix unitaire',
  discount: 'Remise',
  vat: 'TVA',
  total: 'Total',
};

/** Bloc « produits » : colonnes configurables en visibilité, ordre et alignement. */
@Component({
  selector: 'app-invoice-items-table',
  template: `
    <div [style.padding.px]="settings().page.padding">
      <table class="w-full border-collapse">
        <thead>
          <tr [style.background]="settings().theme.tableHeaderColor">
            @for (column of visibleColumns(); track column.key) {
              <th
                class="px-2 py-1.5 text-[0.65rem] font-semibold uppercase"
                [class]="alignOf(column)"
                [style.borderBottom]="'1px solid ' + settings().theme.borderColor"
              >
                {{ label(column.key) }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (line of data().lines; track line.description) {
            <tr>
              @for (column of visibleColumns(); track column.key) {
                <td
                  class="px-2 py-1.5"
                  [class]="alignOf(column)"
                  [style.borderBottom]="'1px solid ' + settings().theme.borderColor"
                >
                  {{ cell(line, column.key) }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InvoiceItemsTableComponent implements TemplateBlockInputs {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();

  protected readonly visibleColumns = computed(() =>
    (this.block().settings.columns ?? DEFAULT_ITEMS_COLUMNS).filter((column) => column.visible),
  );

  protected label(key: ItemsColumnKey): string {
    return COLUMN_LABELS[key];
  }

  protected alignOf(column: ItemsColumn): string {
    return alignmentClass(column.align);
  }

  protected cell(line: SampleInvoiceLine, key: ItemsColumnKey): string {
    switch (key) {
      case 'description':
        return line.description;
      case 'quantity':
        return String(line.quantity);
      case 'unitPrice':
        return line.unitPrice;
      case 'discount':
        return line.discount;
      case 'vat':
        return line.vat;
      case 'total':
        return line.total;
    }
  }
}
