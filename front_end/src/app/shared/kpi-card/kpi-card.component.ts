import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type KpiTone = 'brand' | 'success' | 'warning' | 'danger';

const ACCENTS: Record<KpiTone, string> = {
  brand: 'from-brand-500 to-brand-700',
  success: 'from-emerald-400 to-emerald-600',
  warning: 'from-amber-400 to-amber-600',
  danger: 'from-rose-400 to-rose-600',
};

/**
 * Indicateur du tableau de bord. Toujours cliquable : le cahier des charges
 * exige que chaque indicateur renvoie vers la liste filtrée correspondante (P02).
 */
@Component({
  selector: 'app-kpi-card',
  imports: [RouterLink],
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input<string | null>(null);
  readonly tone = input<KpiTone>('brand');
  readonly link = input.required<string>();
  readonly filter = input<string | null>(null);

  protected readonly accent = computed(() => ACCENTS[this.tone()]);
  protected readonly queryParams = computed(() =>
    this.filter() ? { statut: this.filter() } : {},
  );
}
