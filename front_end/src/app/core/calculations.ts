import { Discount, DocumentTax, Invoice, InvoiceStatus, Line, Payment } from './models';

/** Taux de TVA proposé par défaut sur un nouveau document. */
export const DEFAULT_VAT_RATE = 20;

/** Arrondi monétaire à deux décimales. */
export function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const NO_DISCOUNT: Discount = { type: 'PERCENT', value: 0 };

/** Applique une remise exprimée en pourcentage ou en montant fixe. */
export function applyDiscount(base: number, discount: Discount): number {
  if (!discount.value) {
    return base;
  }
  const reduced =
    discount.type === 'PERCENT' ? base - (base * discount.value) / 100 : base - discount.value;

  // Une remise ne rend jamais une ligne négative.
  return base >= 0 ? Math.max(0, reduced) : reduced;
}

/** quantité × prix unitaire, puis remise de ligne. */
export function lineTotal(line: Line): number {
  return applyDiscount(line.quantity * line.unitPrice, {
    type: line.discountType,
    value: line.discountValue,
  });
}

export interface VatBreakdown {
  rate: number;
  base: number;
  amount: number;
}

/** Taxe calculée d'un document : la même structure pour la TVA et les autres. */
export interface TaxLine {
  label: string;
  rate: number;
  amount: number;
}

/** Régime de taxation du document, décidé document par document. */
export interface Taxation {
  vatApplicable: boolean;
  extraTaxes: DocumentTax[];
}

export const DEFAULT_TAXATION: Taxation = { vatApplicable: true, extraTaxes: [] };

export interface Totals {
  /** Somme des lignes avant remise globale. */
  subtotal: number;
  globalDiscountAmount: number;
  totalExclVat: number;
  /** Vide lorsque la TVA n'est pas applicable au document. */
  vatBreakdown: VatBreakdown[];
  totalVat: number;
  /** Taxes additionnelles, calculées sur la base hors taxes. */
  taxBreakdown: TaxLine[];
  totalExtraTaxes: number;
  totalInclVat: number;
}

/**
 * Règle du cahier des charges : la TVA est calculée par taux et arrondie
 * à deux décimales au niveau de chaque taux, jamais au niveau de la ligne.
 * La remise globale est répartie au prorata de chaque taux.
 *
 * La TVA peut être retirée du document (créateur non assujetti, export…) :
 * les bases restent ventilées, seul le montant de taxe disparaît. Les taxes
 * additionnelles s'appliquent ensuite sur la base hors taxes.
 */
export function computeTotals(
  lines: Line[],
  globalDiscount: Discount = NO_DISCOUNT,
  taxation: Taxation = DEFAULT_TAXATION,
): Totals {
  const bases = new Map<number, number>();
  let subtotal = 0;

  for (const line of lines) {
    const base = lineTotal(line);
    subtotal += base;
    bases.set(line.vatRate, (bases.get(line.vatRate) ?? 0) + base);
  }

  const discounted = applyDiscount(subtotal, globalDiscount);
  const ratio = subtotal === 0 ? 1 : discounted / subtotal;

  const ventilation = [...bases.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => ({
      rate,
      base: round(base * ratio),
      amount: taxation.vatApplicable ? round(((base * ratio) * rate) / 100) : 0,
    }));

  const totalExclVat = round(ventilation.reduce((sum, v) => sum + v.base, 0));
  const vatBreakdown = taxation.vatApplicable ? ventilation : [];
  const totalVat = round(vatBreakdown.reduce((sum, v) => sum + v.amount, 0));

  const taxBreakdown = taxation.extraTaxes
    .filter((tax) => tax.rate !== 0)
    .map((tax) => ({
      label: tax.label,
      rate: tax.rate,
      amount: round((totalExclVat * tax.rate) / 100),
    }));
  const totalExtraTaxes = round(taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0));

  return {
    subtotal: round(subtotal),
    globalDiscountAmount: round(subtotal - discounted),
    totalExclVat,
    vatBreakdown,
    totalVat,
    taxBreakdown,
    totalExtraTaxes,
    totalInclVat: round(totalExclVat + totalVat + totalExtraTaxes),
  };
}

/** Régime de taxation porté par un document. */
export function taxationOf(document: {
  vatApplicable: boolean;
  extraTaxes: DocumentTax[];
}): Taxation {
  return { vatApplicable: document.vatApplicable, extraTaxes: document.extraTaxes };
}

export function invoiceTotal(invoice: Invoice): number {
  return computeTotals(invoice.lines, invoice.globalDiscount, taxationOf(invoice)).totalInclVat;
}

export function paidAmount(invoiceId: string, payments: Payment[]): number {
  return round(
    payments.filter((p) => p.invoiceId === invoiceId).reduce((sum, p) => sum + p.amount, 0),
  );
}

/** Reste dû = total TTC − somme des paiements enregistrés. */
export function outstanding(invoice: Invoice, payments: Payment[]): number {
  return round(invoiceTotal(invoice) - paidAmount(invoice.id, payments));
}

/** Montant de l'acompte demandé sur le document. */
export function depositAmount(invoice: Invoice): number {
  return round((invoiceTotal(invoice) * invoice.depositPercent) / 100);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function addMonths(date: string, months: number): string {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const start = new Date(from + 'T00:00:00Z').getTime();
  const end = new Date(to + 'T00:00:00Z').getTime();
  return Math.round((end - start) / 86_400_000);
}

/** date du jour − date d'échéance, uniquement si le reste dû est > 0. */
export function daysOverdue(invoice: Invoice, payments: Payment[], date = today()): number {
  if (outstanding(invoice, payments) <= 0) {
    return 0;
  }
  return Math.max(0, daysBetween(invoice.dueDate, date));
}

/**
 * Recalcul quotidien du statut (P08). Les statuts terminaux
 * DRAFT et CANCELLED ne sont jamais recalculés.
 */
export function recomputeStatus(
  invoice: Invoice,
  payments: Payment[],
  date = today(),
): InvoiceStatus {
  if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
    return invoice.status;
  }

  const paid = paidAmount(invoice.id, payments);
  const total = invoiceTotal(invoice);

  if (paid >= total) {
    return 'PAID';
  }
  if (daysBetween(invoice.dueDate, date) > 0) {
    return 'OVERDUE';
  }
  return paid > 0 ? 'PARTIALLY_PAID' : 'SENT';
}

/** Numérotation {PRÉFIXE}-{ANNÉE}-{COMPTEUR} sans trou. */
export function documentNumber(prefix: string, year: number, counter: number): string {
  return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
}

/** Moyenne, sur les factures soldées, de date du dernier paiement − date d'émission. */
export function averagePaymentDelay(invoices: Invoice[], payments: Payment[]): number {
  const delays: number[] = [];

  for (const invoice of invoices) {
    const received = payments.filter((p) => p.invoiceId === invoice.id);
    if (!received.length || outstanding(invoice, payments) > 0) {
      continue;
    }
    const last = received.map((p) => p.date).sort().at(-1)!;
    delays.push(daysBetween(invoice.issueDate, last));
  }

  if (!delays.length) {
    return 0;
  }
  return Math.round(delays.reduce((sum, d) => sum + d, 0) / delays.length);
}
