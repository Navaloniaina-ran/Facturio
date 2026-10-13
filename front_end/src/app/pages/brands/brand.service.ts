import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { apiErrorResult } from '../../core/api/api-error';
import { CreatorApiService } from '../../core/api/creator-api.service';
import { averagePaymentDelay, round } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { ActionResult, Brand } from '../../core/models';
import { checkLimit } from '../../core/quotas';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';

export interface BrandView extends Brand {
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  averageDelay: number;
  lastActivity: string | null;
  /** Au moins une facture en retard : filtre « mauvais payeurs ». */
  latePayer: boolean;
  /** Part des factures soldées sans retard. */
  onTimeRate: number;
  /** Note de fiabilité sur 100, pour classer les marques. */
  reliability: number;
  reliabilityKey: string;
  settledCount: number;
}

export type BrandDraft = Omit<Brand, 'id' | 'remindersPaused'>;

export const EMPTY_BRAND: BrandDraft = {
  name: '',
  contact: '',
  email: '',
  phone: '',
  address: '',
  countryCode: 'FR',
  paymentTermsDays: 30,
  notes: '',
};

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly api = inject(CreatorApiService);
  private readonly i18n = inject(I18nService);

  readonly list = computed<BrandView[]>(() => {
    const payments = this.store.payments();

    return this.store.brands().map((brand) => {
      const invoices = this.invoices.list().filter((i) => i.brandId === brand.id);
      const raw = this.store.invoices().filter((i) => i.brandId === brand.id);

      return {
        ...brand,
        invoiceCount: invoices.length,
        totalInvoiced: round(invoices.reduce((sum, i) => sum + i.totalInclVat, 0)),
        totalPaid: round(invoices.reduce((sum, i) => sum + i.paidAmount, 0)),
        outstanding: round(
          invoices
            .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
            .reduce((sum, i) => sum + i.outstanding, 0),
        ),
        averageDelay: averagePaymentDelay(raw, payments),
        lastActivity:
          invoices
            .map((i) => i.issueDate)
            .sort()
            .at(-1) ?? null,
        latePayer: invoices.some((i) => i.status === 'OVERDUE'),
        ...this.reliabilityOf(brand, invoices, averagePaymentDelay(raw, payments)),
      };
    });
  });

  readonly latePayerCount = computed(() => this.list().filter((b) => b.latePayer).length);

  /** Marques classées de la plus fiable à la moins fiable, encaissements à l'appui. */
  readonly mostReliable = computed(() =>
    this.list()
      .filter((brand) => brand.settledCount > 0 || brand.outstanding > 0)
      .sort((a, b) => b.reliability - a.reliability || b.totalPaid - a.totalPaid),
  );

  /**
   * Note de fiabilité : on part de 100, on retire les retards observés et le
   * dépassement du délai négocié, on tient compte du reste dû encore ouvert.
   */
  private reliabilityOf(
    brand: Brand,
    invoices: { status: string; daysOverdue: number; outstanding: number; paidAmount: number }[],
    averageDelay: number,
  ) {
    const settled = invoices.filter((i) => i.status === 'PAID');
    const onTime = settled.filter((i) => i.daysOverdue === 0).length;
    const onTimeRate = settled.length ? Math.round((onTime / settled.length) * 100) : 0;

    const overdueNow = invoices.filter((i) => i.status === 'OVERDUE');
    const worstDelay = Math.max(0, ...invoices.map((i) => i.daysOverdue));
    const beyondTerms = Math.max(0, averageDelay - brand.paymentTermsDays);

    let score = settled.length ? onTimeRate : 60;
    score -= overdueNow.length * 15;
    score -= Math.min(30, worstDelay);
    score -= Math.min(20, beyondTerms);

    const reliability = Math.max(0, Math.min(100, Math.round(score)));
    const reliabilityKey =
      reliability >= 85
        ? 'reliability.excellent'
        : reliability >= 65
          ? 'reliability.good'
          : reliability >= 40
            ? 'reliability.fair'
            : 'reliability.risky';

    return { onTimeRate, reliability, reliabilityKey, settledCount: settled.length };
  }

  byId(id: string): BrandView | undefined {
    return this.list().find((brand) => brand.id === id);
  }

  create(draft: BrandDraft): Observable<ActionResult> {
    const invalid = this.validate(draft);
    if (invalid) {
      return of(invalid);
    }

    const block = checkLimit(this.store.creator().plan, 'brands', this.store.brands().length);
    if (block) {
      return of({ ok: false, errorKey: block.errorKey, params: block.params });
    }

    if (!this.store.remote()) {
      this.add({ ...draft, id: this.store.newId('b'), remindersPaused: false });
      return of({ ok: true });
    }

    return this.api.createBrand(draft).pipe(
      tap((brand) => this.add(brand)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  update(id: string, draft: BrandDraft): Observable<ActionResult> {
    const invalid = this.validate(draft);
    if (invalid) {
      return of(invalid);
    }

    if (!this.store.remote()) {
      this.replace(id, (brand) => ({ ...brand, ...draft }));
      return of({ ok: true });
    }

    return this.api.updateBrand(id, draft).pipe(
      tap((brand) => this.replace(id, () => brand)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  /** Une marque rattachée à une facture n'est jamais supprimée. */
  remove(id: string): Observable<ActionResult> {
    if (this.store.invoices().some((invoice) => invoice.brandId === id)) {
      return of({ ok: false, errorKey: 'brand.error.hasInvoices' });
    }

    if (!this.store.remote()) {
      this.drop(id);
      return of({ ok: true });
    }

    return this.api.deleteBrand(id).pipe(
      tap(() => this.drop(id)),
      map(() => ({ ok: true }) as ActionResult),
      // Le serveur seul connaît les documents déjà émis pour cette marque.
      catchError((error: HttpErrorResponse) =>
        of(
          apiErrorResult(error, {
            brand_has_documents: 'brand.error.hasInvoices',
            brand_linked: 'brand.error.linked',
          }),
        ),
      ),
    );
  }

  /** Suspend ou reprend les relances automatiques de la marque. */
  togglePause(id: string): Observable<ActionResult> {
    if (!this.store.remote()) {
      this.replace(id, (brand) => ({ ...brand, remindersPaused: !brand.remindersPaused }));
      return of({ ok: true });
    }

    return this.api.toggleBrandReminders(id).pipe(
      tap((brand) => this.replace(id, () => brand)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  private validate(draft: BrandDraft): ActionResult | null {
    if (!draft.name.trim()) {
      return { ok: false, errorKey: 'brand.error.name' };
    }
    if (draft.email && !draft.email.includes('@')) {
      return { ok: false, errorKey: 'brand.error.email' };
    }
    return null;
  }

  private add(brand: Brand): void {
    this.store.brands.update((brands) => [...brands, brand]);
    this.store.log('BRAND', 'activity.brandAdded', { name: brand.name });
  }

  private replace(id: string, change: (brand: Brand) => Brand): void {
    this.store.brands.update((brands) =>
      brands.map((brand) => (brand.id === id ? change(brand) : brand)),
    );
  }

  private drop(id: string): void {
    this.store.brands.update((brands) => brands.filter((brand) => brand.id !== id));
  }

  /** Export CSV du portefeuille de marques, en-têtes dans la langue courante. */
  toCsv(): string {
    const headers = [
      this.i18n.t('csv.name'),
      this.i18n.t('csv.contact'),
      this.i18n.t('csv.email'),
      this.i18n.t('csv.phone'),
      this.i18n.t('csv.invoices'),
      this.i18n.t('csv.invoiced'),
      this.i18n.t('csv.outstanding'),
    ];

    const rows = this.list().map((brand) =>
      [
        brand.name,
        brand.contact,
        brand.email,
        brand.phone,
        brand.invoiceCount,
        brand.totalInvoiced,
        brand.outstanding,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(';'),
    );

    return [headers.join(';'), ...rows].join('\n');
  }
}
