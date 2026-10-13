import { TestBed } from '@angular/core/testing';
import { addDays, today } from '../../core/calculations';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';
import { QuoteService } from './quote.service';

describe('QuoteService', () => {
  let service: QuoteService;
  let invoices: InvoiceService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteService);
    invoices = TestBed.inject(InvoiceService);
    store = TestBed.inject(WorkspaceStore);
  });

  it('computes the totals of every quote', () => {
    const quote = service.list().find((q) => q.number === 'PRO-2026-0001')!;

    expect(quote.totalExclVat).toBe(1500);
    expect(quote.totalInclVat).toBe(1800);
  });

  it('marks a sent quote as expired once the date has passed', () => {
    store.quotes.update((quotes) =>
      quotes.map((quote) =>
        quote.number === 'PRO-2026-0003'
          ? { ...quote, status: 'SENT', expiryDate: addDays(today(), -1) }
          : quote,
      ),
    );

    expect(service.list().find((q) => q.number === 'PRO-2026-0003')?.status).toBe('EXPIRED');
  });

  // Critère de recette A06 du cahier des charges.
  it('converts an accepted quote into an identical invoice and locks the quote', () => {
    const accepted = service.list().find((quote) => quote.status === 'ACCEPTED')!;

    const result = service.convertToInvoice(accepted.id);

    expect(result.ok).toBe(true);
    expect(result.value?.totalInclVat).toBe(accepted.totalInclVat);
    expect(result.value?.quoteId).toBe(accepted.id);
    expect(result.value?.number).not.toBe('');

    const after = service.byId(accepted.id)!;
    expect(after.status).toBe('INVOICED');
    expect(after.invoiceId).toBe(result.value?.id);
  });

  it('refuses to convert a quote that is not accepted', () => {
    const sent = service.list().find((quote) => quote.status === 'SENT')!;

    const result = service.convertToInvoice(sent.id);

    expect(result.errorKey).toBe('quote.error.notAccepted');
    expect(invoices.list().some((invoice) => invoice.quoteId === sent.id)).toBe(false);
  });

  it('activates the campaign when the linked quote is accepted', () => {
    const quote = service.list().find((q) => q.number === 'PRO-2026-0003')!;
    store.quotes.update((quotes) =>
      quotes.map((q) => (q.id === quote.id ? { ...q, campaignId: 'c2' } : q)),
    );

    service.mark(quote.id, 'ACCEPTED');

    const campaign = store.campaigns().find((c) => c.id === 'c2')!;
    expect(campaign.quoteAccepted).toBe(true);
    expect(campaign.status).toBe('ACTIVE');
  });

  it('only deletes drafts', () => {
    const sent = service.list().find((quote) => quote.status === 'SENT')!;
    expect(service.remove(sent.id).errorKey).toBe('quote.error.draftOnly');

    service.create({
      brandId: 'b1',
      campaignId: null,
      date: today(),
      expiryDate: addDays(today(), 10),
      terms: '',
      lines: [
        {
          id: 'l1',
          description: 'Story',
          deliverableType: 'STORY',
          quantity: 1,
          unitPrice: 100,
          discountType: 'PERCENT',
          discountValue: 0,
          vatRate: 20,
        },
      ],
      globalDiscount: { type: 'PERCENT', value: 0 },
      vatApplicable: true,
      extraTaxes: [],
      draft: true,
    });

    const draft = service.list().find((quote) => quote.status === 'DRAFT')!;
    expect(service.remove(draft.id).ok).toBe(true);
  });

  it('computes the acceptance rate', () => {
    expect(service.acceptanceRate()).toBe(100);
  });
});
