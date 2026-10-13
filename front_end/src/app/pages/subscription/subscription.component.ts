import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { BillingCycle, PlanCode, PlatformInvoice } from '../../core/models';
import { AmountPipe } from '../../shared/amount.pipe';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { SubscriptionService } from './subscription.service';

/** Abonnement du créateur : offre, consommation, périodicité, factures (P14). */
@Component({
  selector: 'app-subscription',
  imports: [AmountPipe, LocalDatePipe, StatusBadgeComponent, IconButtonComponent],
  templateUrl: './subscription.component.html',
})
export class SubscriptionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(SubscriptionService);

  protected readonly message = signal<string | null>(null);

  protected choose(plan: PlanCode): void {
    this.service.changePlan(plan).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('subscription.flash.changed', { plan }) : this.i18n.error(result),
      );
    });
  }

  protected setCycle(cycle: BillingCycle): void {
    this.service.setCycle(cycle).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('subscription.flash.cycle') : this.i18n.error(result),
      );
    });
  }

  protected cancel(): void {
    this.service.cancel().subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('subscription.flash.cancelled') : this.i18n.error(result),
      );
    });
  }

  protected resume(): void {
    this.service.resume().subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('subscription.flash.resumed') : this.i18n.error(result),
      );
    });
  }

  protected priceOf(plan: { monthlyPrice: number; annualPrice: number }): number {
    return this.service.current().cycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
  }

  /** Reçu texte : le PDF d'abonnement est produit par la plateforme en production. */
  protected download(invoice: PlatformInvoice): void {
    const lines = [
      `${this.i18n.t('subscription.invoice.number')}: ${invoice.number}`,
      `${this.i18n.t('subscription.invoice.date')}: ${invoice.date}`,
      `${this.i18n.t('subscription.invoice.plan')}: ${invoice.plan}`,
      `${this.i18n.t('subscription.invoice.amount')}: ${invoice.amount}`,
    ];

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    link.download = `${invoice.number}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
