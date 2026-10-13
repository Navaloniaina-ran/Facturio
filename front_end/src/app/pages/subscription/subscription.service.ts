import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { apiErrorResult } from '../../core/api/api-error';
import { CreatorApiService } from '../../core/api/creator-api.service';
import { addMonths, round, today } from '../../core/calculations';
import {
  ActionResult,
  BillingCycle,
  PlanCode,
  PlatformInvoice,
  Subscription,
} from '../../core/models';
import { PLAN_ORDER, QUOTAS } from '../../core/quotas';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';

export interface PlanFeature {
  key: string;
  value: string | number;
  /** Une fonctionnalité absente reste visible, barrée. */
  included: boolean;
}

export interface PlanOffer {
  code: PlanCode;
  monthlyPrice: number;
  annualPrice: number;
  taglineKey: string;
  features: PlanFeature[];
}

export interface UsageRow {
  labelKey: string;
  used: number;
  limit: number | null;
  share: number;
}

/** Grille tarifaire de la plateforme, deux mois offerts sur l'annuel. */
const PRICES: Record<PlanCode, number> = { FREE: 0, PRO: 19, STUDIO: 59 };

/**
 * Abonnement du créateur : offre en cours, consommation face aux quotas,
 * changement d'offre, périodicité et factures d'abonnement (P14).
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly store = inject(WorkspaceStore);
  private readonly api = inject(CreatorApiService);
  private readonly invoices = inject(InvoiceService);

  readonly current = this.store.subscription.asReadonly();
  readonly platformInvoices = computed(() =>
    this.store
      .platformInvoices()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  readonly offers = computed<PlanOffer[]>(() =>
    PLAN_ORDER.map((code) => {
      const quota = QUOTAS[code];
      return {
        code,
        monthlyPrice: PRICES[code],
        annualPrice: round(PRICES[code] * 10),
        taglineKey: `subscription.tagline.${code}`,
        features: [
          {
            key: 'subscription.feature.brands',
            value: this.readable(quota.brands),
            included: true,
          },
          {
            key: 'subscription.feature.invoices',
            value: this.readable(quota.invoicesPerMonth),
            included: true,
          },
          { key: 'subscription.feature.quotes', value: '', included: true },
          {
            key: 'subscription.feature.reminders',
            value: this.readable(quota.reminderSteps),
            included: quota.reminderSteps !== 0,
          },
          { key: 'subscription.feature.campaigns', value: '', included: quota.campaigns },
          {
            key: 'subscription.feature.collaborations',
            value: '',
            included: quota.collaborations,
          },
          { key: 'subscription.feature.branding', value: '', included: quota.branding },
          { key: 'subscription.feature.exports', value: '', included: quota.exports },
          { key: 'subscription.feature.reports', value: '', included: quota.advancedReports },
          { key: 'subscription.feature.ai', value: quota.aiRequests, included: true },
        ],
      };
    }),
  );

  /** Prix facturé selon la périodicité choisie. */
  readonly price = computed(() => {
    const subscription = this.current();
    return subscription.cycle === 'ANNUAL'
      ? round(PRICES[subscription.plan] * 10)
      : PRICES[subscription.plan];
  });

  /** Consommation de l'espace face aux quotas de l'offre. */
  readonly usage = computed<UsageRow[]>(() => {
    const quota = QUOTAS[this.current().plan];
    const rows: { labelKey: string; used: number; limit: number | null }[] = [
      {
        labelKey: 'subscription.usage.brands',
        used: this.store.brands().length,
        limit: quota.brands,
      },
      {
        labelKey: 'subscription.usage.invoices',
        used: this.invoices.issuedThisMonth(),
        limit: quota.invoicesPerMonth,
      },
      {
        labelKey: 'subscription.usage.reminderSteps',
        used: this.store.reminderSteps().filter((step) => step.active).length,
        limit: quota.reminderSteps,
      },
    ];

    return rows.map((row) => ({
      ...row,
      share: row.limit === null ? 0 : Math.min(100, Math.round((row.used / row.limit) * 100)),
    }));
  });

  changePlan(plan: PlanCode): Observable<ActionResult> {
    const subscription = this.current();
    if (subscription.plan === plan) {
      return of({ ok: true });
    }

    if (this.store.remote()) {
      return this.push(plan, subscription.cycle);
    }

    this.store.subscription.set({
      ...subscription,
      plan,
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      nextBillingDate: addMonths(today(), subscription.cycle === 'ANNUAL' ? 12 : 1),
    });
    this.store.creator.update((creator) => ({ ...creator, plan }));

    // Une facture d'abonnement est émise à chaque changement d'offre.
    const amount = subscription.cycle === 'ANNUAL' ? round(PRICES[plan] * 10) : PRICES[plan];
    if (amount > 0) {
      const invoice: PlatformInvoice = {
        id: this.store.newId('pi'),
        number: `SAAS-${new Date().getFullYear()}-${String(this.store.platformInvoices().length + 1).padStart(4, '0')}`,
        date: today(),
        plan,
        cycle: subscription.cycle,
        amount,
        status: 'PAID',
      };
      this.store.platformInvoices.update((invoices) => [invoice, ...invoices]);
    }

    this.store.log('SUBSCRIPTION', 'subscription.flash.changed', { plan });
    return of({ ok: true });
  }

  setCycle(cycle: BillingCycle): Observable<ActionResult> {
    if (this.store.remote()) {
      return this.push(this.current().plan, cycle);
    }

    this.store.subscription.update((subscription) => ({
      ...subscription,
      cycle,
      nextBillingDate: addMonths(today(), cycle === 'ANNUAL' ? 12 : 1),
    }));
    return of({ ok: true });
  }

  /** L'accès reste ouvert jusqu'à l'échéance en cours. */
  cancel(): Observable<ActionResult> {
    if (this.store.remote()) {
      return this.api.cancelSubscription().pipe(
        tap((subscription) => this.apply(subscription)),
        map(() => ({ ok: true }) as ActionResult),
        catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
      );
    }

    this.store.subscription.update((subscription) => ({
      ...subscription,
      cancelAtPeriodEnd: true,
    }));
    this.store.log('SUBSCRIPTION', 'subscription.flash.cancelled');
    return of({ ok: true });
  }

  resume(): Observable<ActionResult> {
    const subscription = this.current();
    if (this.store.remote()) {
      // Reprendre, c'est réengager l'offre en cours : le serveur remet le
      // renouvellement en place et efface la demande de résiliation.
      return this.push(subscription.plan, subscription.cycle);
    }

    this.store.subscription.update((current) => ({
      ...current,
      cancelAtPeriodEnd: false,
      status: 'ACTIVE',
    }));
    this.store.log('SUBSCRIPTION', 'subscription.flash.resumed');
    return of({ ok: true });
  }

  /** Envoie l'offre choisie au serveur, seul maître de la facturation SaaS. */
  private push(plan: PlanCode, cycle: BillingCycle): Observable<ActionResult> {
    return this.api.changePlan(plan, cycle).pipe(
      tap((subscription) => this.apply(subscription)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  private apply(subscription: Subscription): void {
    this.store.subscription.set(subscription);
    this.store.creator.update((creator) => ({ ...creator, plan: subscription.plan }));
    this.api.platformInvoices().subscribe({
      next: (invoices) => this.store.platformInvoices.set(invoices),
      error: () => undefined,
    });
  }

  private readable(limit: number | null): string | number {
    return limit === null ? '∞' : limit;
  }
}
