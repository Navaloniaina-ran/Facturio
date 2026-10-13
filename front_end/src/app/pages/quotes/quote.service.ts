import { Injectable, computed, inject } from '@angular/core';
import { BillingApiService } from '../../core/api/billing-api.service';
import { NO_DISCOUNT, computeTotals, taxationOf, today } from '../../core/calculations';
import { ActionResult, Discount, DocumentTax, Line, Quote, QuoteStatus } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService, InvoiceView } from '../invoices/invoice.service';

export interface QuoteView extends Quote {
  brandName: string;
  brandEmail: string;
  campaignName: string | null;
  subtotal: number;
  globalDiscountAmount: number;
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  taxBreakdown: { label: string; rate: number; amount: number }[];
  totalExtraTaxes: number;
  /** Tant qu'elle n'est pas facturée, une proposition reste modifiable. */
  editable: boolean;
}

export interface QuoteDraft {
  brandId: string;
  campaignId: string | null;
  date: string;
  expiryDate: string;
  terms: string;
  lines: Line[];
  globalDiscount: Discount;
  vatApplicable: boolean;
  extraTaxes: DocumentTax[];
  draft: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly api = inject(BillingApiService);

  readonly list = computed<QuoteView[]>(() =>
    this.store
      .quotes()
      .map((quote) => {
        const totals = computeTotals(quote.lines, quote.globalDiscount, taxationOf(quote));
        const status = this.displayedStatus(quote);
        return {
          ...quote,
          status,
          brandName: this.store.brandName(quote.brandId),
          brandEmail: this.store.brand(quote.brandId)?.email ?? '',
          campaignName: this.store.campaign(quote.campaignId)?.name ?? null,
          subtotal: totals.subtotal,
          globalDiscountAmount: totals.globalDiscountAmount,
          totalExclVat: totals.totalExclVat,
          totalVat: totals.totalVat,
          totalInclVat: totals.totalInclVat,
          taxBreakdown: totals.taxBreakdown,
          totalExtraTaxes: totals.totalExtraTaxes,
          editable: status !== 'INVOICED',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  /** Taux d'acceptation des propositions, pour les rapports. */
  readonly acceptanceRate = computed(() => {
    const decided = this.list().filter(
      (q) => q.status === 'ACCEPTED' || q.status === 'REFUSED' || q.status === 'INVOICED',
    );
    if (!decided.length) {
      return 0;
    }
    const accepted = decided.filter((q) => q.status !== 'REFUSED').length;
    return Math.round((accepted / decided.length) * 100);
  });

  byId(id: string): QuoteView | undefined {
    return this.list().find((quote) => quote.id === id);
  }

  /** Brouillon de saisie aligné sur les paramètres de l'espace. */
  emptyDraft(brandId: string): QuoteDraft {
    return {
      brandId,
      campaignId: null,
      date: today(),
      expiryDate: today(),
      terms: this.store.settings().defaultTerms,
      lines: [],
      globalDiscount: { ...NO_DISCOUNT },
      vatApplicable: true,
      extraTaxes: [],
      draft: false,
    };
  }

  byBrand(brandId: string): QuoteView[] {
    return this.list().filter((quote) => quote.brandId === brandId);
  }

  create(draft: QuoteDraft): ActionResult<QuoteView> {
    if (!draft.brandId) {
      return { ok: false, errorKey: 'quote.error.brand' };
    }
    if (!draft.lines.length) {
      return { ok: false, errorKey: 'quote.error.lines' };
    }

    if (this.store.remote()) {
      this.api.createQuote(draft).subscribe((quote) => this.addRemote(quote));
      return { ok: true };
    }

    const quote: Quote = {
      id: this.store.newId('q'),
      number: draft.draft ? '' : this.store.nextNumber('QUOTE'),
      brandId: draft.brandId,
      campaignId: draft.campaignId,
      date: draft.date,
      expiryDate: draft.expiryDate,
      status: draft.draft ? 'DRAFT' : 'SENT',
      lines: draft.lines,
      globalDiscount: draft.globalDiscount,
      vatApplicable: draft.vatApplicable,
      extraTaxes: draft.extraTaxes,
      terms: draft.terms,
      invoiceId: null,
    };

    this.store.quotes.update((quotes) => [quote, ...quotes]);
    this.store.log('QUOTE', 'activity.quoteCreated', {
      number: quote.number || '—',
      brand: this.store.brandName(quote.brandId),
    });

    return { ok: true, value: this.byId(quote.id) };
  }

  /** Modification : possible jusqu'à la facturation, qui verrouille le document. */
  update(id: string, draft: QuoteDraft): ActionResult<QuoteView> {
    const existing = this.store.quotes().find((quote) => quote.id === id);
    if (!existing) {
      return { ok: false, errorKey: 'quote.error.notFound' };
    }
    if (existing.status === 'INVOICED') {
      return { ok: false, errorKey: 'quote.error.notEditable' };
    }

    if (this.store.remote()) {
      this.api.updateQuote(id, draft).subscribe((quote) => this.replaceRemote(quote));
      return { ok: true, value: this.byId(id) };
    }

    this.store.quotes.update((quotes) =>
      quotes.map((quote) =>
        quote.id === id
          ? {
              ...quote,
              brandId: draft.brandId,
              campaignId: draft.campaignId,
              date: draft.date,
              expiryDate: draft.expiryDate,
              terms: draft.terms,
              lines: draft.lines,
              globalDiscount: draft.globalDiscount,
              vatApplicable: draft.vatApplicable,
              extraTaxes: draft.extraTaxes,
            }
          : quote,
      ),
    );

    return { ok: true, value: this.byId(id) };
  }

  send(id: string): void {
    if (this.store.remote()) {
      this.api.quoteAction(id, 'send').subscribe((quote) => this.replaceRemote(quote));
      return;
    }
    this.store.quotes.update((quotes) =>
      quotes.map((quote) =>
        quote.id === id
          ? {
              ...quote,
              number: quote.number || this.store.nextNumber('QUOTE'),
              status: 'SENT' as QuoteStatus,
            }
          : quote,
      ),
    );
    this.store.log('QUOTE', 'activity.quoteSent', { number: this.byId(id)?.number ?? '' });
  }

  mark(id: string, status: Extract<QuoteStatus, 'ACCEPTED' | 'REFUSED'>): void {
    if (this.store.remote()) {
      const action = status === 'ACCEPTED' ? 'accept' : 'refuse';
      this.api.quoteAction(id, action).subscribe((quote) => this.replaceRemote(quote));
      return;
    }
    this.setStatus(id, status);

    const quote = this.byId(id);
    if (status === 'ACCEPTED' && quote?.campaignId) {
      this.store.campaigns.update((campaigns) =>
        campaigns.map((campaign) =>
          campaign.id === quote.campaignId
            ? { ...campaign, quoteAccepted: true, status: 'ACTIVE' }
            : campaign,
        ),
      );
    }

    this.store.log(
      'QUOTE',
      status === 'ACCEPTED' ? 'activity.quoteAccepted' : 'activity.quoteRefused',
      { number: quote?.number ?? '' },
    );
  }

  /**
   * P06 — Transformation en un clic : report intégral des lignes, des taux
   * de TVA, des remises et des conditions. Le lien de traçabilité est conservé
   * et la proposition devient verrouillée.
   */
  convertToInvoice(id: string): ActionResult<InvoiceView> {
    const quote = this.byId(id);
    if (!quote) {
      return { ok: false, errorKey: 'quote.error.notFound' };
    }
    if (quote.status !== 'ACCEPTED') {
      return { ok: false, errorKey: 'quote.error.notAccepted' };
    }

    if (this.store.remote()) {
      this.api.quoteToInvoice(id).subscribe((invoice) => {
        this.store.invoices.update((items) => [invoice, ...items]);
        this.store.quotes.update((items) =>
          items.map((item) =>
            item.id === id ? { ...item, status: 'INVOICED', invoiceId: invoice.id } : item,
          ),
        );
      });
      return { ok: true };
    }

    const result = this.invoices.create({
      brandId: quote.brandId,
      campaignId: quote.campaignId,
      quoteId: quote.id,
      issueDate: today(),
      dueDate: this.invoices.defaultDueDate(quote.brandId),
      depositPercent: 0,
      terms: quote.terms,
      lines: quote.lines.map((line) => ({ ...line })),
      globalDiscount: { ...quote.globalDiscount },
      vatApplicable: quote.vatApplicable,
      extraTaxes: quote.extraTaxes.map((tax) => ({ ...tax })),
      draft: false,
    });

    if (!result.ok || !result.value) {
      return result;
    }

    const invoice = result.value;
    this.store.quotes.update((quotes) =>
      quotes.map((q) =>
        q.id === id ? { ...q, status: 'INVOICED' as QuoteStatus, invoiceId: invoice.id } : q,
      ),
    );
    this.store.log('INVOICE', 'activity.quoteConverted', {
      number: quote.number,
      invoice: invoice.number,
    });

    return { ok: true, value: invoice };
  }

  duplicate(id: string): void {
    const source = this.byId(id);
    if (!source) {
      return;
    }

    this.create({
      brandId: source.brandId,
      campaignId: source.campaignId,
      date: today(),
      expiryDate: source.expiryDate,
      terms: source.terms,
      lines: source.lines.map((line) => ({ ...line, id: this.store.newId('l') })),
      globalDiscount: { ...source.globalDiscount },
      vatApplicable: source.vatApplicable,
      extraTaxes: source.extraTaxes.map((tax) => ({ ...tax })),
      draft: true,
    });
  }

  /** Suppression réservée aux brouillons. */
  remove(id: string): ActionResult {
    if (this.byId(id)?.status !== 'DRAFT') {
      return { ok: false, errorKey: 'quote.error.draftOnly' };
    }

    if (this.store.remote()) {
      this.api.deleteQuote(id).subscribe(() => {
        this.store.quotes.update((quotes) => quotes.filter((quote) => quote.id !== id));
      });
      return { ok: true };
    }

    this.store.quotes.update((quotes) => quotes.filter((quote) => quote.id !== id));
    return { ok: true };
  }

  /** Passage automatique à Expiré à la date d'expiration. */
  private displayedStatus(quote: Quote): QuoteStatus {
    if (quote.status === 'SENT' && quote.expiryDate < today()) {
      return 'EXPIRED';
    }
    return quote.status;
  }

  private setStatus(id: string, status: QuoteStatus): void {
    this.store.quotes.update((quotes) =>
      quotes.map((quote) => (quote.id === id ? { ...quote, status } : quote)),
    );
  }

  private addRemote(quote: Quote): void {
    this.store.quotes.update((items) => [quote, ...items.filter((item) => item.id !== quote.id)]);
  }

  private replaceRemote(quote: Quote): void {
    this.store.quotes.update((items) => items.map((item) => (item.id === quote.id ? quote : item)));
  }
}
