import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_BY_STATUS: Record<string, StatusTone> = {
  DRAFT: 'neutral',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
  SENT: 'info',
  PENDING: 'info',
  SCHEDULED: 'info',
  ACTIVE: 'info',
  AWAITING: 'warning',
  PARTIALLY_PAID: 'warning',
  ACCEPTED: 'success',
  PAID: 'success',
  COMPLETED: 'success',
  INVOICED: 'success',
  OVERDUE: 'danger',
  REFUSED: 'danger',
  FAILED: 'danger',
};

const CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const DOTS: Record<StatusTone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

/** Badge de statut générique, traduit par le dictionnaire. */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  private readonly i18n = inject(I18nService);

  /** Code du statut, par exemple PARTIALLY_PAID. */
  readonly status = input.required<string>();
  /** Complément affiché après un point médian, par exemple « 12 j ». */
  readonly extra = input<string | null>(null);

  protected readonly label = computed(() => this.i18n.status(this.status()));
  protected readonly classes = computed(() => CLASSES[this.tone()]);
  protected readonly dot = computed(() => DOTS[this.tone()]);

  private tone(): StatusTone {
    return TONE_BY_STATUS[this.status()] ?? 'neutral';
  }
}
