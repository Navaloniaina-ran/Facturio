import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DEFAULT_VAT_RATE, addDays, today } from '../../core/calculations';
import { EmailService } from '../../core/email.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Line, QuoteStatus } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { LineEditorComponent } from '../../shared/line-editor/line-editor.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { CampaignService } from '../campaigns/campaign.service';
import { QuoteDraft, QuoteService, QuoteView } from './quote.service';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import {
  FilterSegment,
  FilterSegmentsComponent,
} from '../../shared/filter-segments/filter-segments.component';
import { FilterChip, ResultBarComponent } from '../../shared/result-bar/result-bar.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/action-menu/action-menu.component';

type Tab = 'ALL' | QuoteStatus;
type Modal = 'form' | 'detail' | 'email' | 'delete' | null;

/** Propositions de collaboration : le devis, dans le vocabulaire créateur. */
@Component({
  selector: 'app-quotes',
  imports: [
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    LineEditorComponent,
    IconButtonComponent,
    PageHeaderComponent,
    SearchFieldComponent,
    FilterSegmentsComponent,
    ResultBarComponent,
    ActionMenuComponent,
  ],
  templateUrl: './quotes.component.html',
})
export class QuotesComponent {
  protected readonly icons = ICONS;

  private readonly routes = inject(WorkspaceRoutes);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly emails = inject(EmailService);
  protected readonly campaigns = inject(CampaignService);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(QuoteService);

  protected readonly brands = this.store.brands.asReadonly();

  protected readonly tabs: Tab[] = [
    'ALL',
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REFUSED',
    'EXPIRED',
    'INVOICED',
  ];

  protected readonly tab = signal<Tab>('ALL');
  protected readonly modal = signal<Modal>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly currentId = signal<string | null>(null);

  protected readonly current = computed(() => {
    const id = this.currentId();
    return id ? (this.service.byId(id) ?? null) : null;
  });

  protected editedId: string | null = null;
  protected draft: QuoteDraft = this.service.emptyDraft('');
  protected emailDraft = { to: '', subject: '', body: '' };

  protected readonly search = signal('');

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.service
      .list()
      .filter(
        (quote) =>
          (this.tab() === 'ALL' || quote.status === this.tab()) &&
          (!term ||
            (quote.number ?? '').toLowerCase().includes(term) ||
            quote.brandName.toLowerCase().includes(term) ||
            (quote.campaignName ?? '').toLowerCase().includes(term)),
      );
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

  protected tabLabel(tab: Tab): string {
    return tab === 'ALL' ? this.i18n.t('common.all') : this.i18n.status(tab);
  }

  protected countFor(tab: Tab): number {
    return tab === 'ALL'
      ? this.service.list().length
      : this.service.list().filter((quote) => quote.status === tab).length;
  }

  protected readonly hasFilters = computed(
    () => this.tab() !== 'ALL' || this.search().trim().length > 0,
  );

  protected resetFilters(): void {
    this.tab.set('ALL');
    this.search.set('');
  }

  protected openCreate(): void {
    this.editedId = null;
    this.draft = this.service.emptyDraft(this.brands()[0]?.id ?? '');
    this.draft.expiryDate = addDays(today(), 30);
    this.draft.terms = this.i18n.t('quotes.defaultTerms');
    this.draft.lines = [this.newLine()];
    this.error.set(null);
    this.modal.set('form');
  }

  protected openEdit(quote: QuoteView): void {
    if (!quote.editable) {
      this.message.set(this.i18n.t('quote.error.notEditable'));
      return;
    }

    this.editedId = quote.id;
    this.currentId.set(quote.id);
    this.draft = {
      brandId: quote.brandId,
      campaignId: quote.campaignId,
      date: quote.date,
      expiryDate: quote.expiryDate,
      terms: quote.terms,
      lines: quote.lines.map((line) => ({ ...line })),
      globalDiscount: { ...quote.globalDiscount },
      vatApplicable: quote.vatApplicable,
      extraTaxes: quote.extraTaxes.map((tax) => ({ ...tax })),
      draft: quote.status === 'DRAFT',
    };
    this.error.set(null);
    this.modal.set('form');
  }

  protected newLine(): Line {
    return {
      id: this.store.newId('l'),
      description: '',
      deliverableType: 'REEL',
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

  protected addTax(): void {
    this.draft.extraTaxes = [
      ...this.draft.extraTaxes,
      { id: this.store.newId('t'), label: this.i18n.t('tax.newLabel'), rate: 0 },
    ];
  }

  protected removeTax(id: string): void {
    this.draft.extraTaxes = this.draft.extraTaxes.filter((tax) => tax.id !== id);
  }

  protected save(asDraft: boolean): void {
    if (this.editedId) {
      const updated = this.service.update(this.editedId, this.draft);
      if (!updated.ok) {
        this.error.set(this.i18n.error(updated));
        return;
      }
      if (!asDraft && updated.value?.status === 'DRAFT') {
        this.service.send(this.editedId);
      }
      this.message.set(this.i18n.t('quotes.flash.updated'));
      this.modal.set(null);
      return;
    }

    const result = this.service.create({ ...this.draft, draft: asDraft });
    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.message.set(
      asDraft
        ? this.i18n.t('quotes.flash.draft')
        : this.i18n.t('quotes.flash.sent', { number: result.value?.number ?? '' }),
    );
    this.modal.set(null);
  }

  protected open(quote: QuoteView, modal: Exclude<Modal, null>): void {
    this.currentId.set(quote.id);
    this.error.set(null);
    this.modal.set(modal);
  }

  protected openEmail(quote: QuoteView): void {
    const composed = this.emails.compose({
      documentType: 'QUOTE',
      number: quote.number || this.i18n.t('common.draft'),
      contact: this.store.brand(quote.brandId)?.contact || quote.brandName,
      total: `${quote.totalInclVat} ${this.store.currency()}`,
      expiryDate: quote.expiryDate,
      withOutstanding: false,
    });

    this.emailDraft = { to: quote.brandEmail, subject: composed.subject, body: composed.body };
    this.open(quote, 'email');
  }

  protected sendEmail(): void {
    const quote = this.current();
    if (!quote) {
      return;
    }

    const result = this.emails.send({
      documentType: 'QUOTE',
      documentId: quote.id,
      documentNumber: quote.number,
      withOutstanding: false,
      ...this.emailDraft,
    });

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    if (quote.status === 'DRAFT') {
      this.service.send(quote.id);
    }
    this.message.set(this.i18n.t('email.flash.sent', { to: this.emailDraft.to }));
    this.modal.set(null);
  }

  protected send(quote: QuoteView): void {
    this.service.send(quote.id);
    this.message.set(this.i18n.t('quotes.flash.sentAgain'));
  }

  protected accept(quote: QuoteView): void {
    this.service.mark(quote.id, 'ACCEPTED');
    this.message.set(this.i18n.t('quotes.flash.accepted'));
  }

  protected refuse(quote: QuoteView): void {
    this.service.mark(quote.id, 'REFUSED');
    this.message.set(this.i18n.t('quotes.flash.refused'));
  }

  /** P06 — Transformation en un clic, sans ressaisie. */
  protected convert(quote: QuoteView): void {
    const result = this.service.convertToInvoice(quote.id);

    if (!result.ok) {
      this.message.set(this.i18n.error(result));
      return;
    }

    this.message.set(this.i18n.t('quotes.flash.converted', { number: result.value?.number ?? '' }));
    void this.router.navigate(this.routes.to('factures'));
  }

  /**
   * Actions secondaires d'une proposition. La ligne ne garde que le geste
   * qu'appelle son statut — envoyer un brouillon, trancher une proposition
   * envoyée, convertir une proposition acceptée — et l'aperçu.
   */
  protected secondaryActions(quote: QuoteView): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];

    if (quote.editable) {
      items.push({
        icon: 'edit',
        tone: 'brand',
        label: this.i18n.t('common.edit'),
        run: () => this.openEdit(quote),
      });
    }

    items.push({
      icon: 'mail',
      tone: 'brand',
      label: this.i18n.t('email.send'),
      run: () => this.openEmail(quote),
    });

    items.push({
      icon: 'duplicate',
      label: this.i18n.t('common.duplicate'),
      run: () => this.duplicate(quote),
    });

    if (quote.status === 'DRAFT') {
      items.push({
        icon: 'delete',
        tone: 'danger',
        label: this.i18n.t('common.delete'),
        run: () => this.open(quote, 'delete'),
      });
    }

    return items;
  }

  protected duplicate(quote: QuoteView): void {
    this.service.duplicate(quote.id);
    this.message.set(this.i18n.t('quotes.flash.duplicated'));
  }

  protected confirmDelete(): void {
    const quote = this.current();
    if (!quote) {
      return;
    }

    const result = this.service.remove(quote.id);
    this.message.set(result.ok ? this.i18n.t('quotes.flash.deleted') : this.i18n.error(result));
    this.close();
  }

  /** Lien public signé de consultation et d'acceptation. */
  protected publicLink(quote: QuoteView): string {
    return `/d/${quote.id}`;
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }
}
