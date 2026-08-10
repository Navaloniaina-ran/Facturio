import { Injectable, computed, inject } from '@angular/core';
import {
  NO_DISCOUNT,
  addDays,
  computeTotals,
  daysBetween,
  daysOverdue,
  outstanding,
  paidAmount,
  recomputeStatus,
  round,
  taxationOf,
  today,
} from '../../core/calculations';
import {
  ActionResult,
  Discount,
  DocumentTax,
  Invoice,
  InvoiceStatus,
  Line,
  Payment,
} from '../../core/models';
import { checkLimit } from '../../core/quotas';
import { WorkspaceStore } from '../../core/workspace-store.service';

/** Facture enrichie des montants calculés : ce que les écrans affichent. */
export interface InvoiceView extends Invoice {
  brandName: string;
  brandEmail: string;
  campaignName: string | null;
  subtotal: number;
  globalDiscountAmount: number;
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  vatBreakdown: { rate: number; base: number; amount: number }[];
  taxBreakdown: { label: string; rate: number; amount: number }[];
  totalExtraTaxes: number;
  paidAmount: number;
  outstanding: number;
  daysOverdue: number;
  /** Acompte demandé sur le document. */
  deposit: number;
  /** Un brouillon reste librement modifiable et supprimable. */
  editable: boolean;
}

export interface InvoiceDraft {
  brandId: string;
  campaignId: string | null;
  quoteId: string | null;
  issueDate: string;
  dueDate: string;
  depositPercent: number;
  terms: string;
  lines: Line[];
  globalDiscount: Discount;
  /** La TVA se décide sur le document, pas dans les paramètres. */
  vatApplicable: boolean;
  /** Taxes additionnelles : retenue à la source, taxe locale… */
  extraTaxes: DocumentTax[];
  /** Un brouillon ne consomme pas de numéro (numérotation sans trou). */
  draft: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly store = inject(WorkspaceStore);

  /** Toutes les factures, statut recalculé et montants à jour. */
  readonly list = computed<InvoiceView[]>(() => {
    const payments = this.store.payments();
    const day = today();

    return this.store
      .invoices()
      .map((invoice) => this.withTotals(invoice, payments, day))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  });

  readonly notCancelled = computed(() => this.list().filter((i) => i.status !== 'CANCELLED'));

  /** Chiffre d'affaires émis (hors brouillons et factures annulées). */
  readonly revenue = computed(() =>
    round(
      this.notCancelled()
        .filter((i) => i.status !== 'DRAFT')
        .reduce((sum, i) => sum + i.totalInclVat, 0),
    ),
  );

  readonly collected = computed(() =>
    round(this.notCancelled().reduce((sum, i) => sum + i.paidAmount, 0)),
  );

  readonly pending = computed(() =>
    round(
      this.notCancelled()
        .filter((i) => i.status === 'SENT' || i.status === 'PARTIALLY_PAID')
        .reduce((sum, i) => sum + i.outstanding, 0),
    ),
  );

  readonly overdue = computed(() => this.list().filter((i) => i.status === 'OVERDUE'));

  readonly overdueAmount = computed(() =>
    round(this.overdue().reduce((sum, i) => sum + i.outstanding, 0)),
  );

  /** Échéances des 7 prochains jours (widget du tableau de bord). */
  readonly upcoming = computed(() =>
    this.list()
      .filter((invoice) => {
        if (invoice.outstanding <= 0 || invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
          return false;
        }
        const days = daysBetween(today(), invoice.dueDate);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  );

  /** Nombre de factures émises sur le mois en cours, pour les quotas. */
  readonly issuedThisMonth = computed(() => {
    const month = today().slice(0, 7);
    return this.store.invoices().filter((invoice) => invoice.issueDate.startsWith(month)).length;
  });

  byId(id: string): InvoiceView | undefined {
    return this.list().find((invoice) => invoice.id === id);
  }

  byBrand(brandId: string): InvoiceView[] {
    return this.list().filter((invoice) => invoice.brandId === brandId);
  }

  /** Brouillon de saisie aligné sur les paramètres de l'espace. */
  emptyDraft(brandId: string): InvoiceDraft {
    const settings = this.store.settings();

    return {
      brandId,
      campaignId: null,
      quoteId: null,
      issueDate: today(),
      dueDate: this.defaultDueDate(brandId),
      depositPercent: 0,
      terms: settings.defaultTerms,
      lines: [],
      globalDiscount: { ...NO_DISCOUNT },
      vatApplicable: true,
      extraTaxes: [],
      draft: false,
    };
  }

  /** Tâche planifiée quotidienne : persiste le statut recalculé (P08). */
  recomputeStatuses(): void {
    const payments = this.store.payments();
    const day = today();

    this.store.invoices.update((invoices) =>
      invoices.map((invoice) => {
        const status = recomputeStatus(invoice, payments, day);
        return status === invoice.status ? invoice : { ...invoice, status };
      }),
    );
  }

  create(draft: InvoiceDraft): ActionResult<InvoiceView> {
    const block = checkLimit(this.store.creator().plan, 'invoicesPerMonth', this.issuedThisMonth());
    if (block) {
      return { ok: false, errorKey: block.errorKey, params: block.params };
    }

    const invoice: Invoice = {
      id: this.store.newId('i'),
      kind: 'INVOICE',
      number: draft.draft ? '' : this.store.nextNumber('INVOICE'),
      brandId: draft.brandId,
      campaignId: draft.campaignId,
      quoteId: draft.quoteId,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      status: draft.draft ? 'DRAFT' : 'SENT',
      lines: draft.lines,
      globalDiscount: draft.globalDiscount,
      vatApplicable: draft.vatApplicable,
      extraTaxes: draft.extraTaxes,
      depositPercent: draft.depositPercent,
      terms: draft.terms,
      sentAt: null,
    };

    this.store.invoices.update((invoices) => [invoice, ...invoices]);
    this.store.log(
      'INVOICE',
      draft.draft ? 'activity.invoiceDrafted' : 'activity.invoiceIssued',
      { number: invoice.number, brand: this.store.brandName(invoice.brandId) },
    );

    return { ok: true, value: this.byId(invoice.id) };
  }

  /**
   * Modification d'une facture. Réservée aux brouillons : dès l'envoi, la
   * correction passe par un avoir (règle 15.1 du cahier des charges).
   */
  update(id: string, draft: InvoiceDraft): ActionResult<InvoiceView> {
    const existing = this.store.invoices().find((invoice) => invoice.id === id);
    if (!existing) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }
    if (existing.status !== 'DRAFT') {
      return { ok: false, errorKey: 'invoice.error.notEditable' };
    }

    this.store.invoices.update((invoices) =>
      invoices.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              brandId: draft.brandId,
              campaignId: draft.campaignId,
              issueDate: draft.issueDate,
              dueDate: draft.dueDate,
              depositPercent: draft.depositPercent,
              terms: draft.terms,
              lines: draft.lines,
              globalDiscount: draft.globalDiscount,
              vatApplicable: draft.vatApplicable,
              extraTaxes: draft.extraTaxes,
            }
          : invoice,
      ),
    );

    return { ok: true, value: this.byId(id) };
  }

  /** Suppression réservée aux brouillons : aucun numéro n'a été consommé. */
  remove(id: string): ActionResult {
    const existing = this.store.invoices().find((invoice) => invoice.id === id);
    if (!existing) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }
    if (existing.status !== 'DRAFT') {
      return { ok: false, errorKey: 'invoice.error.notDeletable' };
    }

    this.store.invoices.update((invoices) => invoices.filter((invoice) => invoice.id !== id));
    return { ok: true };
  }

  /** Échéance par défaut selon les conditions de paiement de la marque. */
  defaultDueDate(brandId: string, issueDate = today()): string {
    const days =
      this.store.brand(brandId)?.paymentTermsDays ?? this.store.settings().defaultPaymentTermsDays;
    return addDays(issueDate, days);
  }

  /** Validation d'un brouillon : le numéro est attribué à cet instant. */
  send(id: string): void {
    this.store.invoices.update((invoices) =>
      invoices.map((invoice) => {
        if (invoice.id !== id) {
          return invoice;
        }
        const number = invoice.number || this.store.nextNumber('INVOICE');
        return { ...invoice, number, status: 'SENT' as InvoiceStatus };
      }),
    );
    this.store.log('INVOICE', 'activity.invoiceSent', { number: this.byId(id)?.number ?? '' });
  }

  /** Horodate le premier envoi par email. */
  markEmailed(id: string): void {
    this.store.invoices.update((invoices) =>
      invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, sentAt: invoice.sentAt ?? today() } : invoice,
      ),
    );
  }

  cancel(id: string): void {
    const number = this.byId(id)?.number ?? '';
    this.setStatus(id, 'CANCELLED');
    this.store.log('INVOICE', 'activity.invoiceCancelled', { number });
  }

  duplicate(id: string): ActionResult<InvoiceView> {
    const source = this.byId(id);
    if (!source) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }

    return this.create({
      brandId: source.brandId,
      campaignId: source.campaignId,
      quoteId: null,
      issueDate: today(),
      dueDate: this.defaultDueDate(source.brandId),
      depositPercent: source.depositPercent,
      terms: source.terms,
      lines: source.lines.map((line) => ({ ...line, id: this.store.newId('l') })),
      globalDiscount: { ...source.globalDiscount },
      vatApplicable: source.vatApplicable,
      extraTaxes: source.extraTaxes.map((tax) => ({ ...tax })),
      draft: true,
    });
  }

  /** Une facture envoyée n'est pas modifiable : toute correction passe par un avoir. */
  createCreditNote(id: string, terms: string): ActionResult<InvoiceView> {
    const source = this.byId(id);
    if (!source) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }

    // Un avoir est un document à part entière : sa propre série, son propre intitulé.
    const creditNote: Invoice = {
      id: this.store.newId('i'),
      kind: 'CREDIT_NOTE',
      number: this.store.nextNumber('CREDIT_NOTE'),
      brandId: source.brandId,
      campaignId: source.campaignId,
      quoteId: null,
      issueDate: today(),
      dueDate: today(),
      status: 'SENT',
      lines: source.lines.map((line) => ({
        ...line,
        id: this.store.newId('l'),
        quantity: -line.quantity,
      })),
      globalDiscount: { ...source.globalDiscount },
      vatApplicable: source.vatApplicable,
      extraTaxes: source.extraTaxes.map((tax) => ({ ...tax })),
      depositPercent: 0,
      terms,
      sentAt: null,
    };

    this.store.invoices.update((invoices) => [creditNote, ...invoices]);
    this.setStatus(id, 'CANCELLED');
    this.store.log('INVOICE', 'activity.creditNoteIssued', {
      number: creditNote.number,
      invoice: source.number,
    });

    return { ok: true, value: this.byId(creditNote.id) };
  }

  private setStatus(id: string, status: InvoiceStatus): void {
    this.store.invoices.update((invoices) =>
      invoices.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)),
    );
  }

  private withTotals(invoice: Invoice, payments: Payment[], day: string): InvoiceView {
    const totals = computeTotals(invoice.lines, invoice.globalDiscount, taxationOf(invoice));
    const status = recomputeStatus(invoice, payments, day);

    return {
      ...invoice,
      status,
      brandName: this.store.brandName(invoice.brandId),
      brandEmail: this.store.brand(invoice.brandId)?.email ?? '',
      campaignName: this.store.campaign(invoice.campaignId)?.name ?? null,
      subtotal: totals.subtotal,
      globalDiscountAmount: totals.globalDiscountAmount,
      totalExclVat: totals.totalExclVat,
      totalVat: totals.totalVat,
      totalInclVat: totals.totalInclVat,
      vatBreakdown: totals.vatBreakdown,
      taxBreakdown: totals.taxBreakdown,
      totalExtraTaxes: totals.totalExtraTaxes,
      paidAmount: paidAmount(invoice.id, payments),
      outstanding: outstanding(invoice, payments),
      daysOverdue: daysOverdue(invoice, payments, day),
      deposit: round((totals.totalInclVat * invoice.depositPercent) / 100),
      editable: status === 'DRAFT',
    };
  }
}
