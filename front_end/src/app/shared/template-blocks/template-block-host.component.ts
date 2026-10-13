import { Component, input } from '@angular/core';
import {
  InvoiceTemplateBlock,
  InvoiceTemplateSettings,
} from '../../core/templates/invoice-template.models';
import { SampleInvoice } from '../../core/templates/sample-invoice';
import { InvoiceCustomerComponent } from './invoice-customer.component';
import { InvoiceFooterComponent } from './invoice-footer.component';
import { InvoiceHeaderComponent } from './invoice-header.component';
import { InvoiceInfoComponent } from './invoice-info.component';
import { InvoiceItemsTableComponent } from './invoice-items-table.component';
import { InvoiceLogoComponent } from './invoice-logo.component';
import { InvoiceNotesComponent } from './invoice-notes.component';
import { InvoicePaymentComponent } from './invoice-payment.component';
import { InvoiceTotalsComponent } from './invoice-totals.component';

/**
 * Renderer : choisit le composant correspondant au `type` du bloc.
 * Ajouter un type de bloc revient à ajouter un composant et un cas ici.
 */
@Component({
  selector: 'app-template-block-host',
  imports: [
    InvoiceHeaderComponent,
    InvoiceLogoComponent,
    InvoiceCustomerComponent,
    InvoiceInfoComponent,
    InvoiceItemsTableComponent,
    InvoiceTotalsComponent,
    InvoicePaymentComponent,
    InvoiceNotesComponent,
    InvoiceFooterComponent,
  ],
  template: `
    @switch (block().type) {
      @case ('header') {
        <app-invoice-header [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('logo') {
        <app-invoice-logo [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('customer') {
        <app-invoice-customer [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('info') {
        <app-invoice-info [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('items') {
        <app-invoice-items-table [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('totals') {
        <app-invoice-totals [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('payment') {
        <app-invoice-payment [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('notes') {
        <app-invoice-notes [block]="block()" [settings]="settings()" [data]="data()" />
      }
      @case ('footer') {
        <app-invoice-footer [block]="block()" [settings]="settings()" [data]="data()" />
      }
    }
  `,
})
export class TemplateBlockHostComponent {
  readonly block = input.required<InvoiceTemplateBlock>();
  readonly settings = input.required<InvoiceTemplateSettings>();
  readonly data = input.required<SampleInvoice>();
}
