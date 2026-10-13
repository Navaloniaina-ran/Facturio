import {
  NO_DISCOUNT,
  addDays,
  computeTotals,
  round,
  taxationOf,
  today,
} from '../../core/calculations';
import { Invoice } from '../../core/models';
import { InvoiceView } from '../../pages/invoices/invoice.service';

/** Textes de la facture d'exemple, fournis traduits par l'écran appelant. */
export interface SampleInvoiceLabels {
  number: string;
  brandName: string;
  brandEmail: string;
  campaignName: string;
  firstLine: string;
  secondLine: string;
  terms: string;
}

/**
 * Facture d'exemple des aperçus de réglage. Les données sont fictives, mais les
 * montants sortent de `computeTotals`, comme ceux d'une vraie facture : ce que
 * l'aperçu affiche est donc bien ce que l'application produira.
 */
export function sampleInvoiceView(labels: SampleInvoiceLabels): InvoiceView {
  const invoice: Invoice = {
    id: 'sample',
    kind: 'INVOICE',
    number: labels.number,
    brandId: 'sample',
    campaignId: 'sample',
    quoteId: null,
    issueDate: today(),
    dueDate: addDays(today(), 30),
    status: 'SENT',
    lines: [
      {
        id: 'sample-1',
        description: labels.firstLine,
        deliverableType: 'REEL',
        quantity: 2,
        unitPrice: 600,
        discountType: 'PERCENT',
        discountValue: 10,
        vatRate: 20,
      },
      {
        id: 'sample-2',
        description: labels.secondLine,
        deliverableType: 'STORY',
        quantity: 1,
        unitPrice: 250,
        discountType: 'PERCENT',
        discountValue: 0,
        vatRate: 20,
      },
    ],
    globalDiscount: { ...NO_DISCOUNT },
    vatApplicable: true,
    extraTaxes: [],
    depositPercent: 30,
    terms: labels.terms,
    sentAt: null,
  };

  const totals = computeTotals(invoice.lines, invoice.globalDiscount, taxationOf(invoice));

  return {
    ...invoice,
    brandName: labels.brandName,
    brandEmail: labels.brandEmail,
    campaignName: labels.campaignName,
    subtotal: totals.subtotal,
    globalDiscountAmount: totals.globalDiscountAmount,
    totalExclVat: totals.totalExclVat,
    totalVat: totals.totalVat,
    totalInclVat: totals.totalInclVat,
    vatBreakdown: totals.vatBreakdown,
    taxBreakdown: totals.taxBreakdown,
    totalExtraTaxes: totals.totalExtraTaxes,
    paidAmount: 0,
    outstanding: totals.totalInclVat,
    daysOverdue: 0,
    deposit: round((totals.totalInclVat * invoice.depositPercent) / 100),
    editable: false,
  };
}
