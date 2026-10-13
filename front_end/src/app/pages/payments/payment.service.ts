import { Injectable, computed, inject } from '@angular/core';
import { BillingApiService } from '../../core/api/billing-api.service';
import { round, today } from '../../core/calculations';
import { ActionResult, Payment, PaymentMethod } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';
import { ReminderService } from '../reminders/reminder.service';

export interface PaymentView extends Payment {
  invoiceNumber: string;
  brandName: string;
}

export interface PaymentDraft {
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly reminders = inject(ReminderService);
  private readonly api = inject(BillingApiService);

  readonly list = computed<PaymentView[]>(() =>
    this.store
      .payments()
      .map((payment) => {
        const invoice = this.store.invoices().find((i) => i.id === payment.invoiceId);
        return {
          ...payment,
          invoiceNumber: invoice?.number || '',
          brandName: invoice ? this.store.brandName(invoice.brandId) : '—',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  readonly collected = computed(() =>
    round(this.list().reduce((sum, payment) => sum + payment.amount, 0)),
  );

  readonly collectedThisMonth = computed(() => {
    const month = today().slice(0, 7);
    return round(
      this.list()
        .filter((payment) => payment.date.startsWith(month))
        .reduce((sum, payment) => sum + payment.amount, 0),
    );
  });

  readonly pending = computed(() => this.invoices.pending());
  readonly overdue = computed(() => this.invoices.overdueAmount());

  /** Seules les factures encore dues peuvent recevoir un versement. */
  readonly dueInvoices = computed(() =>
    this.invoices
      .list()
      .filter((i) => i.outstanding > 0 && i.status !== 'DRAFT' && i.status !== 'CANCELLED'),
  );

  forInvoice(invoiceId: string): PaymentView[] {
    return this.list().filter((payment) => payment.invoiceId === invoiceId);
  }

  /**
   * Enregistre un versement. Un paiement ne peut pas dépasser le reste dû ;
   * dès que la facture est soldée, les relances en attente sont annulées.
   */
  record(draft: PaymentDraft): ActionResult<{ settled: boolean }> {
    const invoice = this.invoices.byId(draft.invoiceId);
    if (!invoice) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }
    if (draft.amount <= 0) {
      return { ok: false, errorKey: 'payment.error.amount' };
    }
    if (draft.amount > invoice.outstanding) {
      return {
        ok: false,
        errorKey: 'payment.error.exceeds',
        params: { amount: `${invoice.outstanding} ${this.store.currency()}` },
      };
    }

    if (this.store.remote()) {
      this.api.createPayment(draft).subscribe((payment) => {
        this.store.payments.update((payments) => [payment, ...payments]);
        this.invoices.recomputeStatuses();
      });
      return { ok: true, value: { settled: draft.amount === invoice.outstanding } };
    }

    const payment: Payment = { ...draft, id: this.store.newId('p') };
    this.store.payments.update((payments) => [payment, ...payments]);
    this.invoices.recomputeStatuses();

    const settled = (this.invoices.byId(draft.invoiceId)?.outstanding ?? 0) <= 0;
    if (settled) {
      this.reminders.cancelFor(draft.invoiceId);
    }

    this.store.log('PAYMENT', 'activity.paymentReceived', {
      amount: `${draft.amount} ${this.store.currency()}`,
      invoice: invoice.number,
    });

    return { ok: true, value: { settled } };
  }

  /** Toute suppression est tracée et recalcule le statut de la facture. */
  remove(id: string): void {
    const payment = this.list().find((p) => p.id === id);
    if (this.store.remote()) {
      this.api.deletePayment(id).subscribe(() => {
        this.store.payments.update((payments) => payments.filter((item) => item.id !== id));
        this.invoices.recomputeStatuses();
      });
      return;
    }
    this.store.payments.update((payments) => payments.filter((p) => p.id !== id));
    this.invoices.recomputeStatuses();

    if (payment) {
      this.store.log('PAYMENT', 'activity.paymentDeleted', {
        amount: `${payment.amount} ${this.store.currency()}`,
        invoice: payment.invoiceNumber,
      });
    }
  }
}
