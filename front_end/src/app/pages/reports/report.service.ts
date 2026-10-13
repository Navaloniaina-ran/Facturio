import { Injectable, computed, inject, signal } from '@angular/core';
import { averagePaymentDelay, lineTotal, round } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { QUOTAS } from '../../core/quotas';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { BrandService } from '../brands/brand.service';
import { InvoiceService } from '../invoices/invoice.service';
import { QuoteService } from '../quotes/quote.service';

export interface ReportRow {
  label: string;
  amount: number;
  share: number;
}

export interface AgingBucket {
  labelKey: string;
  count: number;
  amount: number;
}

export interface YearRow {
  year: number;
  invoiced: number;
  collected: number;
  share: number;
}

export interface MonthRow {
  month: string;
  label: string;
  invoiced: number;
  collected: number;
  share: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly brands = inject(BrandService);
  private readonly quotes = inject(QuoteService);
  private readonly i18n = inject(I18nService);

  readonly advancedReports = computed(() => QUOTAS[this.store.creator().plan].advancedReports);

  readonly revenue = this.invoices.revenue;
  readonly collected = this.invoices.collected;
  readonly acceptanceRate = this.quotes.acceptanceRate;

  readonly averageDelay = computed(() =>
    averagePaymentDelay(this.store.invoices(), this.store.payments()),
  );

  /** Taux d'impayés : part du facturé encore due. */
  readonly unpaidRate = computed(() => {
    const invoiced = this.revenue();
    if (!invoiced) {
      return 0;
    }
    const due = round(
      this.invoices
        .list()
        .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
        .reduce((sum, i) => sum + i.outstanding, 0),
    );
    return Math.round((due / invoiced) * 100);
  });

  /** Top marques par montant facturé. */
  readonly topBrands = computed<ReportRow[]>(() =>
    this.rank(this.brands.list().map((b) => ({ label: b.name, amount: b.totalInvoiced }))),
  );

  /** Revenus par type de livrable — spécifique à l'espace créateur. */
  readonly byDeliverable = computed<ReportRow[]>(() => {
    const totals = new Map<string, number>();

    for (const invoice of this.invoices.list()) {
      if (invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') {
        continue;
      }
      for (const line of invoice.lines) {
        const label = this.i18n.deliverable(line.deliverableType);
        totals.set(label, (totals.get(label) ?? 0) + lineTotal(line));
      }
    }

    return this.rank([...totals].map(([label, amount]) => ({ label, amount: round(amount) })));
  });

  /** Balance âgée des impayés. */
  readonly aging = computed<AgingBucket[]>(() => {
    const buckets: AgingBucket[] = [
      { labelKey: 'aging.notDue', count: 0, amount: 0 },
      { labelKey: 'aging.1to15', count: 0, amount: 0 },
      { labelKey: 'aging.16to30', count: 0, amount: 0 },
      { labelKey: 'aging.over30', count: 0, amount: 0 },
    ];

    for (const invoice of this.invoices.list()) {
      if (
        invoice.outstanding <= 0 ||
        invoice.status === 'DRAFT' ||
        invoice.status === 'CANCELLED'
      ) {
        continue;
      }
      const late = invoice.daysOverdue;
      const index = late === 0 ? 0 : late <= 15 ? 1 : late <= 30 ? 2 : 3;
      buckets[index].count += 1;
      buckets[index].amount = round(buckets[index].amount + invoice.outstanding);
    }

    return buckets;
  });

  /** Chiffre d'affaires facturé des douze derniers mois. */
  readonly monthlyRevenue = computed<ReportRow[]>(() => {
    const reference = new Date();
    const points: { label: string; amount: number }[] = [];

    for (let back = 11; back >= 0; back -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - back, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = round(
        this.invoices
          .list()
          .filter((i) => i.issueDate.startsWith(month) && i.status !== 'CANCELLED')
          .reduce((sum, i) => sum + i.totalInclVat, 0),
      );
      points.push({ label: this.i18n.monthShort(date), amount });
    }

    const maximum = Math.max(...points.map((p) => p.amount), 1);
    return points.map((p) => ({
      ...p,
      share: Math.max(2, Math.round((p.amount / maximum) * 100)),
    }));
  });

  // ----- Statistiques par année et par mois -----

  /** Années couvertes par les factures, de la plus récente à la plus ancienne. */
  readonly years = computed(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    for (const invoice of this.invoices.list()) {
      years.add(Number(invoice.issueDate.slice(0, 4)));
    }
    return [...years].sort((a, b) => b - a);
  });

  private readonly year = signal(new Date().getFullYear());
  readonly selectedYear = this.year.asReadonly();

  selectYear(year: number): void {
    this.year.set(year);
  }

  /** Chiffre d'affaires facturé et encaissé, année par année. */
  readonly byYear = computed<YearRow[]>(() => {
    const rows = this.years()
      .slice()
      .sort((a, b) => a - b)
      .map((year) => ({
        year,
        invoiced: this.invoicedOver(String(year)),
        collected: this.collectedOver(String(year)),
        share: 0,
      }));

    const maximum = Math.max(...rows.map((row) => row.invoiced), 1);
    return rows.map((row) => ({
      ...row,
      share: Math.max(2, Math.round((row.invoiced / maximum) * 100)),
    }));
  });

  /** Les douze mois de l'année sélectionnée. */
  readonly monthsOfYear = computed<MonthRow[]>(() => {
    const year = this.year();
    const rows: MonthRow[] = [];

    for (let month = 0; month < 12; month += 1) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      rows.push({
        month: key,
        label: this.i18n.monthShort(new Date(year, month, 1)),
        invoiced: this.invoicedOver(key),
        collected: this.collectedOver(key),
        share: 0,
      });
    }

    const maximum = Math.max(...rows.map((row) => row.invoiced), 1);
    return rows.map((row) => ({
      ...row,
      share: Math.max(2, Math.round((row.invoiced / maximum) * 100)),
    }));
  });

  /** Évolution de l'année sélectionnée par rapport à la précédente, en %. */
  readonly yearTrend = computed(() => {
    const current = this.invoicedOver(String(this.year()));
    const previous = this.invoicedOver(String(this.year() - 1));

    if (!previous) {
      return current ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  });

  readonly yearInvoiced = computed(() => this.invoicedOver(String(this.year())));
  readonly yearCollected = computed(() => this.collectedOver(String(this.year())));

  readonly bestMonth = computed(() =>
    this.monthsOfYear().reduce(
      (best, row) => (row.invoiced > best.invoiced ? row : best),
      this.monthsOfYear()[0],
    ),
  );

  readonly monthlyAverage = computed(() => {
    const active = this.monthsOfYear().filter((row) => row.invoiced > 0);
    if (!active.length) {
      return 0;
    }
    return round(active.reduce((sum, row) => sum + row.invoiced, 0) / active.length);
  });

  /** Marques les plus fiables, reprises du portefeuille. */
  readonly reliableBrands = computed(() => this.brands.mostReliable());

  private invoicedOver(prefix: string): number {
    return round(
      this.invoices
        .list()
        .filter((invoice) => invoice.issueDate.startsWith(prefix) && invoice.status !== 'CANCELLED')
        .reduce((sum, invoice) => sum + invoice.totalInclVat, 0),
    );
  }

  private collectedOver(prefix: string): number {
    return round(
      this.store
        .payments()
        .filter((payment) => payment.date.startsWith(prefix))
        .reduce((sum, payment) => sum + payment.amount, 0),
    );
  }

  /** Export CSV du rapport de synthèse. */
  toCsv(): string {
    const rows: (string | number)[][] = [
      [this.i18n.t('csv.indicator'), this.i18n.t('csv.value')],
      [this.i18n.t('kpi.revenue'), this.revenue()],
      [this.i18n.t('kpi.collected'), this.collected()],
      [this.i18n.t('reports.kpi.unpaidRate'), this.unpaidRate()],
      [this.i18n.t('reports.kpi.avgDelay'), this.averageDelay()],
      [this.i18n.t('reports.kpi.acceptance'), this.acceptanceRate()],
    ];

    return rows.map((row) => row.join(';')).join('\n');
  }

  private rank(entries: { label: string; amount: number }[]): ReportRow[] {
    const sorted = entries.filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
    const maximum = Math.max(...sorted.map((e) => e.amount), 1);

    return sorted.map((entry) => ({
      ...entry,
      share: Math.max(4, Math.round((entry.amount / maximum) * 100)),
    }));
  }
}
