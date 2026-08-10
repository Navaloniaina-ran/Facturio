import { TestBed } from '@angular/core/testing';
import { addDays, today } from '../../core/calculations';
import { Line } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceDraft, InvoiceService } from './invoice.service';

function line(unitPrice: number, vatRate = 20): Line {
  return {
    id: 'l-test',
    description: 'Reel Instagram',
    deliverableType: 'REEL',
    quantity: 1,
    unitPrice,
    discountType: 'PERCENT',
    discountValue: 0,
    vatRate,
  };
}

function draft(partial: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    brandId: 'b1',
    campaignId: null,
    quoteId: null,
    issueDate: today(),
    dueDate: addDays(today(), 30),
    depositPercent: 0,
    terms: '',
    lines: [line(1000)],
    globalDiscount: { type: 'PERCENT', value: 0 },
    vatApplicable: true,
    extraTaxes: [],
    draft: false,
    ...partial,
  };
}

describe('InvoiceService', () => {
  let service: InvoiceService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceService);
    store = TestBed.inject(WorkspaceStore);
  });

  it('enriches every invoice with its computed amounts', () => {
    const invoice = service.list().find((i) => i.number === 'FAC-2026-0001')!;

    expect(invoice.totalExclVat).toBe(1500);
    expect(invoice.totalInclVat).toBe(1800);
    expect(invoice.paidAmount).toBe(900);
    expect(invoice.outstanding).toBe(900);
    expect(invoice.deposit).toBe(900);
  });

  it('numbers an issued invoice and leaves a draft without a number', () => {
    const issued = service.create(draft()).value!;

    expect(issued.number.startsWith(`FAC-${new Date().getFullYear()}-`)).toBe(true);
    expect(service.create(draft({ draft: true })).value?.number).toBe('');
  });

  it('assigns the number when the draft is approved', () => {
    const created = service.create(draft({ draft: true })).value!;

    service.send(created.id);

    const sent = service.byId(created.id)!;
    expect(sent.number).not.toBe('');
    expect(sent.status).toBe('SENT');
  });

  it('derives the due date from the brand payment terms', () => {
    // Glow Cosmetics pays within 15 days.
    expect(service.defaultDueDate('b2', '2026-08-01')).toBe('2026-08-16');
  });

  it('blocks creation beyond the monthly quota without a technical error', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));
    const before = store.invoices().length;

    for (let i = 0; i < 6; i += 1) {
      service.create(draft());
    }

    const result = service.create(draft());
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('quota.limit');
    expect(store.invoices().length).toBeLessThan(before + 7);
  });

  it('issues a credit note on its own series and cancels the original invoice', () => {
    const source = service.list().find((i) => i.number === 'FAC-2026-0004')!;

    const result = service.createCreditNote(source.id, 'Avoir');

    expect(result.ok).toBe(true);
    expect(result.value?.kind).toBe('CREDIT_NOTE');
    expect(result.value?.number.startsWith('AV-')).toBe(true);
    expect(result.value?.totalInclVat).toBeLessThan(0);
    expect(service.byId(source.id)?.status).toBe('CANCELLED');
  });

  it('lets a draft be updated then deleted, and protects a sent invoice', () => {
    const created = service.create(draft({ draft: true })).value!;

    const updated = service.update(created.id, draft({ draft: true, lines: [line(2000, 0)] }));
    expect(updated.ok).toBe(true);
    expect(service.byId(created.id)?.totalInclVat).toBe(2000);

    expect(service.remove(created.id).ok).toBe(true);
    expect(service.byId(created.id)).toBeUndefined();

    const sent = service.list().find((invoice) => invoice.status === 'SENT')!;
    expect(service.update(sent.id, draft()).errorKey).toBe('invoice.error.notEditable');
    expect(service.remove(sent.id).errorKey).toBe('invoice.error.notDeletable');
  });

  it('carries the taxation of the document into its totals', () => {
    const created = service.create(
      draft({
        lines: [line(1000, 20)],
        vatApplicable: false,
        extraTaxes: [{ id: 't1', label: 'Retenue', rate: -5 }],
      }),
    ).value!;

    expect(created.totalVat).toBe(0);
    expect(created.totalExtraTaxes).toBe(-50);
    expect(created.totalInclVat).toBe(950);
  });

  it('duplicates an invoice as a draft', () => {
    const source = service.list()[0];

    const copy = service.duplicate(source.id).value!;

    expect(copy.status).toBe('DRAFT');
    expect(copy.lines.length).toBe(source.lines.length);
    expect(copy.id).not.toBe(source.id);
  });

  it('recomputes and persists overdue statuses', () => {
    service.recomputeStatuses();

    expect(store.invoices().find((i) => i.number === 'FAC-2026-0002')?.status).toBe('OVERDUE');
  });

  it('keeps only due dates within the next seven days', () => {
    const numbers = service.upcoming().map((invoice) => invoice.number);

    expect(numbers).toContain('FAC-2026-0004');
    expect(numbers).not.toContain('FAC-2026-0002');
  });
});
