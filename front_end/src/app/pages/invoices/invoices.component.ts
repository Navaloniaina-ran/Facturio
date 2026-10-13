import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_VAT_RATE, today } from '../../core/calculations';
import { EmailService } from '../../core/email.service';
import { InvoiceTemplateApi } from '../../core/templates/invoice-template.api';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { InvoiceStatus, Line, PaymentMethod } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { InvoicePreviewComponent } from '../../shared/invoice-preview/invoice-preview.component';
import { LineEditorComponent } from '../../shared/line-editor/line-editor.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/action-menu/action-menu.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService } from '../campaigns/campaign.service';
import { PaymentService } from '../payments/payment.service';
import { ReminderService } from '../reminders/reminder.service';
import { InvoiceDraft, InvoiceService, InvoiceView } from './invoice.service';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ViewSwitchComponent } from '../../shared/view-switch/view-switch.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import {
  FilterSegment,
  FilterSegmentsComponent,
} from '../../shared/filter-segments/filter-segments.component';
import { FilterChip, ResultBarComponent } from '../../shared/result-bar/result-bar.component';

type Tab = 'ALL' | InvoiceStatus;
type Modal = 'form' | 'detail' | 'payment' | 'credit' | 'preview' | 'email' | 'delete' | null;

/** Colonne de tri : l'en-tête du tableau et le sélecteur pilotent la même clé. */
export type InvoiceSort = 'number' | 'brand' | 'issue' | 'due' | 'total' | 'outstanding';
export type SortDirection = 'asc' | 'desc';

/**
 * Sens le plus utile à la première ouverture de chaque colonne. Un montant
 * s'ouvre du plus gros au plus petit ; une échéance, de la plus proche à la
 * plus lointaine — c'est celle qui presse.
 */
const NATURAL_DIRECTION: Record<InvoiceSort, SortDirection> = {
  number: 'desc',
  brand: 'asc',
  issue: 'desc',
  due: 'asc',
  total: 'desc',
  outstanding: 'desc',
};

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
    PageHeaderComponent,
    ViewSwitchComponent,
    SearchFieldComponent,
    FilterSegmentsComponent,
    ResultBarComponent,
    ActionMenuComponent,
  ],
  templateUrl: './invoices.component.html',
})
export class InvoicesComponent {
  protected readonly icons = ICONS;

  protected readonly routes = inject(WorkspaceRoutes);
  private readonly store = inject(WorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly payments = inject(PaymentService);
  private readonly reminders = inject(ReminderService);
  private readonly emails = inject(EmailService);
  private readonly templateApi = inject(InvoiceTemplateApi);
  protected readonly templates = inject(InvoiceTemplateStore);
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

  /** Modèle retenu pour le PDF serveur ; par défaut, celui de l'espace. */
  protected readonly templateId = signal<string>('');

  protected readonly sortKey = signal<InvoiceSort>('issue');
  protected readonly sortDirection = signal<SortDirection>('desc');
  protected readonly view = signal<'table' | 'grid'>('table');

  protected readonly sorts: { key: InvoiceSort; labelKey: string }[] = [
    { key: 'issue', labelKey: 'invoices.col.issue' },
    { key: 'due', labelKey: 'invoices.col.due' },
    { key: 'number', labelKey: 'invoices.col.number' },
    { key: 'brand', labelKey: 'invoices.col.brand' },
    { key: 'total', labelKey: 'invoices.col.total' },
    { key: 'outstanding', labelKey: 'invoices.col.outstanding' },
  ];

  protected readonly filtered = computed(() => {
    const tab = this.tab();
    const term = this.search().trim().toLowerCase();
    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return this.service
      .list()
      .filter((invoice) => tab === 'ALL' || invoice.status === tab)
      .filter(
        (invoice) =>
          !term ||
          invoice.number.toLowerCase().includes(term) ||
          invoice.brandName.toLowerCase().includes(term) ||
          String(invoice.totalInclVat).includes(term),
      )
      .sort((a, b) => this.compare(a, b, key) * direction);
  });

  /** Segments de la barre d'outils : l'effectif est annoncé avant le clic. */
  protected readonly filterSegments = computed<FilterSegment[]>(() =>
    this.tabs.map((tab) => ({
      key: tab,
      label: this.tabLabel(tab),
      count: this.countFor(tab),
    })),
  );

  protected readonly filterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const term = this.search().trim();

    if (term) {
      chips.push({
        label: this.i18n.t('list.searchChip', { term }),
        tone: 'brand',
        clear: () => this.search.set(''),
      });
    }

    if (this.tab() !== 'ALL') {
      chips.push({
        label: this.tabLabel(this.tab()),
        clear: () => this.tab.set('ALL'),
      });
    }

    return chips;
  });

  /** Un clic sur un en-tête déjà trié inverse le sens. */
  protected toggleSort(key: InvoiceSort): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }
    this.setSort(key);
  }

  protected setSort(key: InvoiceSort): void {
    this.sortKey.set(key);
    this.sortDirection.set(NATURAL_DIRECTION[key]);
  }

  protected ariaSort(key: InvoiceSort): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) {
      return 'none';
    }
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  private compare(a: InvoiceView, b: InvoiceView, key: InvoiceSort): number {
    switch (key) {
      case 'brand':
        return a.brandName.localeCompare(b.brandName);
      case 'issue':
        return a.issueDate.localeCompare(b.issueDate);
      case 'due':
        return a.dueDate.localeCompare(b.dueDate);
      case 'total':
        return a.totalInclVat - b.totalInclVat;
      case 'outstanding':
        return a.outstanding - b.outstanding;
      default:
        return (a.number || '').localeCompare(b.number || '');
    }
  }

  protected tabLabel(tab: Tab): string {
    return tab === 'ALL' ? this.i18n.t('common.all') : this.i18n.status(tab);
  }

  protected countFor(tab: Tab): number {
    return tab === 'ALL'
      ? this.service.list().length
      : this.service.list().filter((invoice) => invoice.status === tab).length;
  }

  // ---------- Création et modification ----------

  protected readonly hasFilters = computed(
    () => this.tab() !== 'ALL' || this.search().trim().length > 0,
  );

  /** Une tuile de synthèse réoriente la liste plutôt que de la commenter. */
  protected focusOn(tab: Tab, sort: InvoiceSort): void {
    this.tab.set(tab);
    this.setSort(sort);
  }

  protected resetFilters(): void {
    this.tab.set('ALL');
    this.search.set('');
  }

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

    // Les modèles ne sont chargés qu'au moment où l'on en a besoin.
    if (modal === 'preview' && !this.templates.templates().length) {
      void this.templates.loadAll().then(() => {
        this.templateId.set(this.templates.defaultTemplate()?.id ?? '');
      });
    }
  }

  /** Le PDF est produit par le backend, à partir du modèle et de la facture. */
  protected async downloadPdf(invoice: InvoiceView): Promise<void> {
    const template = this.templateId() || this.templates.defaultTemplate()?.id;
    if (!template) {
      this.message.set(this.i18n.t('templates.pdfUnavailable'));
      return;
    }

    try {
      const blob = await firstValueFrom(this.templateApi.downloadPdf(invoice.id, template));
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${invoice.number}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      this.message.set(this.i18n.t('templates.pdfUnavailable'));
    }
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
    this.message.set(result.ok ? this.i18n.t('invoices.flash.deleted') : this.i18n.error(result));
    this.close();
  }

  protected send(invoice: InvoiceView): void {
    this.service.send(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.sent'));
  }

  /**
   * Actions secondaires d'une ligne, regroupées dans le menu de débordement.
   * Seuls l'aperçu, l'envoi, l'encaissement et la relance restent visibles :
   * ce sont les quatre gestes qu'on fait sans réfléchir depuis la liste.
   */
  protected secondaryActions(invoice: InvoiceView): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        icon: 'details',
        label: this.i18n.t('invoices.detail.payments'),
        run: () => this.open(invoice, 'detail'),
      },
    ];

    if (invoice.editable) {
      items.push({
        icon: 'edit',
        tone: 'brand',
        label: this.i18n.t('invoices.edit'),
        run: () => this.openEdit(invoice),
      });
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED') {
      items.push({
        icon: 'mail',
        tone: 'brand',
        label: this.i18n.t('email.send'),
        run: () => this.openEmail(invoice),
      });
    }

    items.push({
      icon: 'duplicate',
      label: this.i18n.t('common.duplicate'),
      run: () => this.duplicate(invoice),
    });

    if (invoice.status !== 'DRAFT') {
      items.push({
        icon: 'xml',
        label: this.i18n.t('facturx.exportXml'),
        run: () => void this.exportFacturXXml(invoice),
      });
    }

    if (invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT') {
      items.push({
        icon: 'creditNote',
        label: this.i18n.t('invoices.credit'),
        run: () => this.open(invoice, 'credit'),
      });
    }

    if (invoice.editable) {
      items.push({
        icon: 'delete',
        tone: 'danger',
        label: this.i18n.t('common.delete'),
        run: () => this.open(invoice, 'delete'),
      });
    }

    return items;
  }

  protected duplicate(invoice: InvoiceView): void {
    this.service.duplicate(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.duplicated'));
  }

  protected cancel(invoice: InvoiceView): void {
    this.service.cancel(invoice.id);
    this.message.set(this.i18n.t('invoices.flash.cancelled', { number: invoice.number }));
  }

  /**
   * Export du XML Factur-X (EN 16931, syntaxe CII). L'assemblage du PDF/A-3
   * qui embarque ce fichier est réalisé par le moteur PDF côté serveur.
   */
  protected async exportFacturXXml(invoice: InvoiceView): Promise<void> {
    try {
      const blob = await firstValueFrom(this.templateApi.downloadFacturXXml(invoice.id));
      this.download(blob, `${invoice.number}-factur-x.xml`);
      this.message.set(this.i18n.t('facturx.flash.exported', { profile: this.profileLabel }));
    } catch {
      this.message.set(this.i18n.t('templates.pdfUnavailable'));
    }
  }

  protected async exportFacturXPdf(invoice: InvoiceView): Promise<void> {
    try {
      const blob = await firstValueFrom(this.templateApi.downloadFacturXPdf(invoice.id));
      this.download(blob, `${invoice.number}-factur-x.pdf`);
      this.message.set(this.i18n.t('facturx.flash.exported', { profile: this.profileLabel }));
    } catch {
      this.message.set(this.i18n.t('templates.pdfUnavailable'));
    }
  }

  private download(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /** Dernier segment du profil, seul lisible dans un message. */
  protected readonly profileLabel = 'EN16931';

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
