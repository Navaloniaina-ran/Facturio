import {
  applyDiscount,
  addDays,
  averagePaymentDelay,
  computeTotals,
  daysOverdue,
  documentNumber,
  lineTotal,
  outstanding,
  paidAmount,
  recomputeStatus,
} from './calculations';
import { Invoice, Line, Payment } from './models';

function line(partial: Partial<Line> = {}): Line {
  return {
    id: 'l1',
    description: 'Reel Instagram',
    deliverableType: 'REEL',
    quantity: 1,
    unitPrice: 1000,
    discountType: 'PERCENT',
    discountValue: 0,
    vatRate: 20,
    ...partial,
  };
}

function invoice(partial: Partial<Invoice> = {}): Invoice {
  return {
    id: 'i1',
    kind: 'INVOICE',
    number: 'FAC-2026-0001',
    brandId: 'b1',
    campaignId: null,
    quoteId: null,
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    status: 'SENT',
    lines: [line({ unitPrice: 3000, vatRate: 0 })],
    globalDiscount: { type: 'PERCENT', value: 0 },
    vatApplicable: true,
    extraTaxes: [],
    depositPercent: 0,
    sentAt: null,
    terms: '',
    ...partial,
  };
}

describe('calculations', () => {
  it('applies the line discount to quantity × unit price', () => {
    expect(lineTotal(line({ quantity: 2, unitPrice: 500, discountValue: 10 }))).toBe(900);
  });

  // Critère de recette A05 du cahier des charges.
  it('computes 1,000 excl. VAT with a 10% discount and 20% VAT → 900 / 180 / 1,080', () => {
    const totals = computeTotals([line({ unitPrice: 1000, discountValue: 10 })]);

    expect(totals.totalExclVat).toBe(900);
    expect(totals.totalVat).toBe(180);
    expect(totals.totalInclVat).toBe(1080);
  });

  it('applies a fixed-amount line discount', () => {
    expect(
      lineTotal(line({ quantity: 2, unitPrice: 500, discountType: 'AMOUNT', discountValue: 150 })),
    ).toBe(850);
  });

  it('never lets a discount push a line below zero', () => {
    expect(applyDiscount(100, { type: 'AMOUNT', value: 250 })).toBe(0);
  });

  it('spreads an overall discount across the VAT rates', () => {
    const totals = computeTotals(
      [
        line({ id: 'a', unitPrice: 800, vatRate: 20 }),
        line({ id: 'b', unitPrice: 200, vatRate: 0 }),
      ],
      { type: 'PERCENT', value: 10 },
    );

    expect(totals.subtotal).toBe(1000);
    expect(totals.globalDiscountAmount).toBe(100);
    expect(totals.totalExclVat).toBe(900);
    expect(totals.totalVat).toBe(144);
    expect(totals.totalInclVat).toBe(1044);
  });

  it('accepts an overall discount expressed as an amount', () => {
    const totals = computeTotals([line({ unitPrice: 1000, vatRate: 0 })], {
      type: 'AMOUNT',
      value: 250,
    });

    expect(totals.globalDiscountAmount).toBe(250);
    expect(totals.totalInclVat).toBe(750);
  });

  it('drops the VAT when it is not applicable, keeping the taxable bases', () => {
    const totals = computeTotals([line({ unitPrice: 1000 })], undefined, {
      vatApplicable: false,
      extraTaxes: [],
    });

    expect(totals.totalExclVat).toBe(1000);
    expect(totals.vatBreakdown).toEqual([]);
    expect(totals.totalVat).toBe(0);
    expect(totals.totalInclVat).toBe(1000);
  });

  it('adds an extra tax on the amount excluding VAT', () => {
    const totals = computeTotals([line({ unitPrice: 1000, vatRate: 0 })], undefined, {
      vatApplicable: true,
      extraTaxes: [{ id: 't1', label: 'Taxe locale', rate: 2 }],
    });

    expect(totals.taxBreakdown).toEqual([{ label: 'Taxe locale', rate: 2, amount: 20 }]);
    expect(totals.totalInclVat).toBe(1020);
  });

  it('treats a negative rate as a withholding', () => {
    const totals = computeTotals([line({ unitPrice: 1000, vatRate: 0 })], undefined, {
      vatApplicable: false,
      extraTaxes: [{ id: 't1', label: 'Retenue à la source', rate: -5 }],
    });

    expect(totals.totalExtraTaxes).toBe(-50);
    expect(totals.totalInclVat).toBe(950);
  });

  it('breaks VAT down by rate, never by line', () => {
    const totals = computeTotals([
      line({ id: 'a', unitPrice: 100, vatRate: 20 }),
      line({ id: 'b', unitPrice: 200, vatRate: 20 }),
      line({ id: 'c', unitPrice: 100, vatRate: 10 }),
    ]);

    expect(totals.vatBreakdown).toEqual([
      { rate: 20, base: 300, amount: 60 },
      { rate: 10, base: 100, amount: 10 },
    ]);
    expect(totals.totalInclVat).toBe(470);
  });

  // Critère de recette A07 du cahier des charges.
  it('computes the outstanding balance after two partial payments', () => {
    const target = invoice();
    const payments: Payment[] = [
      {
        id: 'p1',
        invoiceId: 'i1',
        amount: 1000,
        date: '2026-08-05',
        method: 'TRANSFER',
        reference: '',
        note: '',
      },
      {
        id: 'p2',
        invoiceId: 'i1',
        amount: 1000,
        date: '2026-08-12',
        method: 'TRANSFER',
        reference: '',
        note: '',
      },
    ];

    expect(paidAmount('i1', payments)).toBe(2000);
    expect(outstanding(target, payments)).toBe(1000);
    expect(recomputeStatus(target, payments, '2026-08-15')).toBe('PARTIALLY_PAID');
  });

  // Critère de recette A08 du cahier des charges.
  it('turns overdue the day after the due date when a balance remains', () => {
    const target = invoice({ dueDate: '2026-08-10' });

    expect(recomputeStatus(target, [], '2026-08-10')).toBe('SENT');
    expect(recomputeStatus(target, [], '2026-08-14')).toBe('OVERDUE');
    expect(daysOverdue(target, [], '2026-08-14')).toBe(4);
  });

  it('turns paid and drops the delay as soon as the balance is zero', () => {
    const target = invoice({ dueDate: '2026-08-01' });
    const payments: Payment[] = [
      {
        id: 'p1',
        invoiceId: 'i1',
        amount: 3000,
        date: '2026-08-03',
        method: 'CARD',
        reference: '',
        note: '',
      },
    ];

    expect(recomputeStatus(target, payments, '2026-08-14')).toBe('PAID');
    expect(daysOverdue(target, payments, '2026-08-14')).toBe(0);
  });

  it('never recomputes a draft nor a cancelled invoice', () => {
    expect(recomputeStatus(invoice({ status: 'DRAFT' }), [], '2027-01-01')).toBe('DRAFT');
    expect(recomputeStatus(invoice({ status: 'CANCELLED' }), [], '2027-01-01')).toBe('CANCELLED');
  });

  it('formats the document numbering', () => {
    expect(documentNumber('FAC', 2026, 42)).toBe('FAC-2026-0042');
  });

  it('shifts a date by a number of days', () => {
    expect(addDays('2026-08-31', 3)).toBe('2026-09-03');
  });

  it('computes the average payment delay over settled invoices', () => {
    const target = invoice({ issueDate: '2026-08-01' });
    const payments: Payment[] = [
      {
        id: 'p1',
        invoiceId: 'i1',
        amount: 3000,
        date: '2026-08-11',
        method: 'TRANSFER',
        reference: '',
        note: '',
      },
    ];

    expect(averagePaymentDelay([target], payments)).toBe(10);
  });
});
