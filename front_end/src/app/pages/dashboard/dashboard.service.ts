import { Injectable, computed, inject } from '@angular/core';
import { round } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { BrandService } from '../brands/brand.service';
import { CampaignService } from '../campaigns/campaign.service';
import { CollaborationService } from '../collaborations/collaboration.service';
import { InvoiceService } from '../invoices/invoice.service';
import { PaymentService } from '../payments/payment.service';
import { ReminderService } from '../reminders/reminder.service';

export interface RevenuePoint {
  month: string;
  label: string;
  amount: number;
  /** Hauteur relative de la barre, en pourcentage. */
  share: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly payments = inject(PaymentService);
  private readonly campaigns = inject(CampaignService);
  private readonly reminders = inject(ReminderService);
  private readonly brands = inject(BrandService);
  private readonly collaborations = inject(CollaborationService);
  private readonly i18n = inject(I18nService);

  readonly creator = this.store.creator.asReadonly();
  readonly currency = this.store.currency;
  readonly onboarding = this.store.onboarding;

  readonly revenue = this.invoices.revenue;
  readonly collected = this.invoices.collected;
  readonly pending = this.invoices.pending;
  readonly overdueAmount = this.invoices.overdueAmount;
  readonly overdueCount = computed(() => this.invoices.overdue().length);
  readonly upcoming = this.invoices.upcoming;
  readonly activeCampaigns = this.campaigns.active;
  readonly toRemind = computed(() => this.reminders.queue().length);

  /** Marques les plus fiables : qui paie vite, sans retard, et solde tout. */
  readonly reliableBrands = computed(() => this.brands.mostReliable().slice(0, 4));

  /** Collaborations en cours dont l'action est à mener. */
  readonly nextCollaborations = this.collaborations.nextActions;
  readonly pipelineValue = this.collaborations.pipelineValue;

  readonly recentInvoices = computed(() => this.invoices.list().slice(0, 5));
  readonly activities = computed(() => this.store.activities().slice(0, 6));

  /** Revenus encaissés des six derniers mois, normalisés pour l'affichage. */
  readonly lastSixMonths = computed<RevenuePoint[]>(() => {
    const payments = this.payments.list();
    const reference = new Date();
    const points: RevenuePoint[] = [];

    for (let back = 5; back >= 0; back -= 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() - back, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = round(
        payments.filter((p) => p.date.startsWith(month)).reduce((sum, p) => sum + p.amount, 0),
      );

      points.push({ month, label: this.i18n.monthShort(date), amount, share: 0 });
    }

    const maximum = Math.max(...points.map((p) => p.amount), 1);
    return points.map((point) => ({
      ...point,
      share: Math.max(4, Math.round((point.amount / maximum) * 100)),
    }));
  });

  readonly remainingOnboarding = computed(() => this.onboarding().filter((task) => !task.done));
}
