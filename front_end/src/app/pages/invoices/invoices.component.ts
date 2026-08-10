import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_VAT_RATE, today } from '../../core/calculations';
import { EmailService } from '../../core/email.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { InvoiceStatus, Line, PaymentMethod } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { InvoicePreviewComponent } from '../../shared/invoice-preview/invoice-preview.component';
import { LineEditorComponent } from '../../shared/line-editor/line-editor.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService } from '../campaigns/campaign.service';
import { PaymentService } from '../payments/payment.service';
import { ReminderService } from '../reminders/reminder.service';
import { InvoiceDraft, InvoiceService, InvoiceView } from './invoice.service';

type Tab = 'ALL' | InvoiceStatus;
type Modal = 'form' | 'detail' | 'payment' | 'credit' | 'preview' | 'email' | 'delete' | null;

const METHODS: PaymentMethod[] = ['TRANSFER', 'MOBILE_MONEY', 'CARD', 'CASH', 'PAYPAL'];

/** Module le plus critique de l'application (P01, P06, P07, P08). */
@Component({
  selector: 'app-invoices',
  imports: [
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    LineEditorComponent,
    InvoicePreviewComponent,
    IconButtonComponent,
  ],
  templateUrl: './invoices.component.html',
})
export class InvoicesComponent {
  private readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly payments = inject(PaymentService);
  private readonly reminders = inject(ReminderService);
  private readonly emails = inject(EmailService);
  protected readonly campaigns = inject(CampaignService);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(InvoiceService);

  protected readonly brands = this.store.brands.asReadonly();
  protected readonly methods = METHODS;

  protected readonly tabs: Tab[] = [
    'ALL',
    'DRAFT',
    'SENT',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ];

  protected readonly tab = signal<Tab>(
    (this.route.snapshot.queryParamMap.get('statut') as Tab | null) ?? 'ALL',
  );
  protected readonly search = signal('');
  protected readonly modal = signal<Modal>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly currentId = signal<string | null>(null);

  /** Recalculée à chaque écriture : la modale reflète les montants à jour. */
  protected readonly current = computed(() => {
    const id = this.currentId();
    return id ? (this.service.byId(id) ?? null) : null;
  });

  protected editedId: string | null = null;
  protected draft: InvoiceDraft = this.service.emptyDraft('');

  protected paymentDraft = {
    amount: 0,
    date: today(),
    method: 'TRANSFER' as PaymentMethod,
    reference: '',
    note: '',
  };

  protected emailDraft = { to: '', subject: '', body: '', withOutstanding: true };

  protected readonly filtered = computed(() => {
    const tab = this.tab();
    const term = this.search().trim().toLowerCase();

    return this.service
      .list()
      .filter((invoice) => tab === 'ALL' || invoice.status === tab)
      .filter(
        (invoice) =>
          !term ||
          invoice.number.toLowerCase().includes(term) ||
          invoice.brandName.toLowerCase().includes(term) ||
          String(invoice.totalInclVat).includes(term),
      );
  });

  protected tabLabel(tab: Tab): string {
    return tab === 'ALL' ? this.i18n.t('common.all') : this.i18n.status(tab);
  }

  protected countFor(tab: Tab): number {
    return tab === 'ALL'
      ? this.service.list().length
      : this.service.list().filter((invoice) => invoice.status === tab).length;
  }

  // ---------- Création et modification ----------

  protected openCreate(): void {
    this.editedId = null;
    this.draft = this.service.emptyDraft(this.brands()[0]?.id ?? '');
    this.draft.lines = [this.newLine()];
    this.error.set(null);
    this.modal.set('form');
  }

  /** Reprise d'un brouillon dans le même formulaire que la création. */
  protected openEdit(invoice: InvoiceView): void {
    if (!invoice.editable) {
      this.message.set(this.i18n.t('invoice.error.notEditable'));
      return;
    }

    this.editedId = invoice.id;
    this.currentId.set(invoice.id);
    this.draft = {
      brandId: invoice.brandId,
      campaignId: invoice.campaignId,
      quoteId: invoice.quoteId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      depositPercent: invoice.depositPercent,
      terms: invoice.terms,
      lines: invoice.lines.map((line) => ({ ...line })),
      globalDiscount: { ...invoice.globalDiscount },
      vatApplicable: invoice.vatApplicable,
      extraTaxes: invoice.extraTaxes.map((tax) => ({ ...tax })),
      draft: true,
    };
    this.error.set(null);
    this.modal.set('form');
  }

  protected newLine(): Line {
    return {
      id: this.store.newId('l'),
      description: '',
      deliverableType: 'POST',
      quantity: 1,
      unitPrice: 0,
      discountType: 'PERCENT',
      discountValue: 0,
      vatRate: DEFAULT_VAT_RATE,
    };
  }

  protected addLine(): void {
    this.draft.lines = [...this.draft.lines, this.newLine()];
  }

  protected removeLine(id: string): void {
    this.draft.lines = this.draft.lines.filter((line) => line.id !== id);
  }

  /** Taxe additionnelle du document : retenue, taxe locale… */
  protected addTax(): void {
    this.draft.extraTaxes = [
      ...this.draft.extraTaxes,
      { id: this.store.newId('t'), label: this.i18n.t('tax.newLabel'), rate: 0 },
    ];
  }

  protected removeTax(id: string): void {
    this.draft.extraTaxes = this.draft.extraTaxes.filter((tax) => tax.id !== id);
  }

  protected refreshDueDate(): void {
    this.draft.dueDate = this.service.defaultDueDate(this.draft.brandId, this.draft.issueDate);
  }

  protected save(asDraft: boolean): void {
    if (!this.draft.brandId) {
      this.error.set(this.i18n.t('invoice.error.brand'));
      return;
    }
    if (!this.draft.lines.length || this.draft.lines.some((line) => !line.description.trim())) {
      this.error.set(this.i18n.t('invoice.error.description'));
      return;
    }

    if (this.editedId) {
      const updated = this.service.update(this.editedId, { ...this.draft, draft: true });
      if (!updated.ok) {
        this.error.set(this.i18n.error(updated));
        return;
      }
      if (!asDraft) {
        this.service.send(this.editedId);
      }
      this.message.set(this.i18n.t('invoices.flash.updated'));
      this.modal.set(null);
      return;
    }

    const result = this.service.create({ ...this.draft, draft: asDraft });
    if (!result.ok) {
      this.error.set(this.i18n.error(result) ?? this.i18n.t('invoice.error.create'));
      return;
    }

    this.message.set(
      asDraft
        ? this.i18n.t('invoices.flash.draft')
        : this.i18n.t('invoices.flash.issued', { number: result.value?.number ?? '' }),
    );
    this.modal.set(null);
  }

  // ---------- Actions unitaires ----------

  protected open(invoice: InvoiceView, modal: Exclude<Modal, null>): void {
    this.currentId.set(invoice.id);
    this.error.set(null);
    this.modal.set(modal);
  }

  protected openPayment(invoice: InvoiceView): void {
    this.paymentDraft = {
      amount: invoice.outstanding,
      date: today(),
      method: 'TRANSFER',
      reference: '',
      note: '',
    };
    this.open(invoice, 'payment');
  }

  /** Email pré-rempli, avec rappel du reste à payer. */
  protected openEmail(invoice: InvoiceView): void {
    const composed = this.emails.compose({
      documentType: 'INVOICE',
      number: invoice.number || this.i18n.t('common.draft'),
      contact: this.store.brand(invoice.brandId)?.contact || invoice.brandName,
      total: `${invoice.totalInclVat} ${this.store.currency()}`,
      dueDate: invoice.dueDate,
      outstanding: `${invoice.outstanding} ${this.store.currency()}`,
      paid: `${invoice.paidAmount} ${this.store.currency()}`,
      withOutstanding: invoice.paidAmount > 0,
    });

    this.emailDraft = {
      to: invoice.brandEmail,
      subject: composed.subject,
      body: composed.body,
      withOutstanding: invoice.paidAmount > 0,
    };
    this.open(invoice, 'email');
  }

  protected refreshEmailBody(): void {
    const invoice = this.current();
    if (!invoice) {
      return;
    }

    const composed = this.emails.compose({
      documentType: 'INVOICE',
      number: invoice.number || this.i18n.t('common.draft'),
      contact: this.store.brand(invoice.brandId)?.contact || invoice.brandName,
      total: `${invoice.totalInclVat} ${this.store.currency()}`,
      dueDate: invoice.dueDate,
      outstanding: `${invoice.outstanding} ${this.store.currency()}`,
      paid: `${invoice.paidAmount} ${this.store.currency()}`,
      withOutstanding: this.emailDraft.withOutstanding,
    });
    this.emailDraft = { ...this.emailDraft, body: composed.body };
  }

  protected sendEmail(): void {
    const invoice = this.current();
    if (!invoice) {
      return;
    }

    const result = this.emails.send({
      documentType: 'INVOICE',
      documentId: invoice.id,
      documentNumber: invoice.number,
      ...this.emailDraft,
    });

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.service.markEmailed(invoice.id);
    this.message.set(this.i18n.t('email.flash.sent', { to: this.emailDraft.to }));
    this.modal.set(null);
  }

  protected recordPayment(): void {
    const invoice = this.current();
    if (!invoice) {
      return;
    }

    const result = this.payments.record({
      invoiceId: invoice.id,
      amount: Number(this.paymentDraft.amount),
      date: this.paymentDraft.date,
      method: this.paymentDraft.method,
      reference: this.paymentDraft.reference,
      note: this.paymentDraft.note,
    });

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.message.set(
      this.i18n.t(result.value?.settled ? 'invoices.flash.settled' : 'invoices.flash.partial'),
    );
    this.modal.set(null);
  }

  protected confirmCredit(): void {
    const invoice = this.current();
    if (!invoice) {
      return;
    }

    const result = this.service.createCreditNote(
      invoice.id,
      this.i18n.t('invoices.credit.terms', { number: invoice.number }),
    );

    this.message.set(
      result.ok
        ? this.i18n.t('invoices.flash.credit', {
            credit: result.value?.number ?? '',
            number: invoice.number,
          })
        : this.i18n.t('invoice.error.credit'),
    );
    this.close();
  }

  protected confirmDelete(): void {
    const invoice = this.current();
    if (!invoice) {
      return;
    }

    const result = this.service.remove(invoice.id);
    this.message.set(
      result.ok ? this.i18n.t('invoices.flash.deleted') : this.i18n.error(result),
    );
    this.close();
  }

  protected send(invoice: InvoiceView): void {
    this.service.send(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.sent'));
  }

  protected duplicate(invoice: InvoiceView): void {
    this.service.duplicate(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.duplicated'));
  }

  protected cancel(invoice: InvoiceView): void {
    this.service.cancel(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.cancelled', { number: invoice.number }));
  }

  protected paymentsOf(invoiceId: string) {
    return this.payments.forInvoice(invoiceId);
  }

  protected remindersOf(invoiceId: string) {
    return this.reminders.historyFor(invoiceId);
  }

  protected emailsOf(invoiceId: string) {
    return this.emails.historyFor(invoiceId);
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }
}
