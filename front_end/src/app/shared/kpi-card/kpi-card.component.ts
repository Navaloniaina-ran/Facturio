import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICONS } from '../icons';

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
  /**
   * Indicateur de tête : il porte le chiffre qu'on vient chercher en
   * premier. Un seul par écran, sans quoi la hiérarchie s'annule.
   */
  readonly emphasis = input(false);
  /** Passe la carte en alerte : le chiffre appelle une action. */
  readonly alert = input(false);

  protected readonly icons = ICONS;
  /** Filet de tête : la teinte du ton, épaissie sur l'indicateur principal. */
  protected readonly accent = computed(
    () => `${this.emphasis() ? 'h-1.5' : 'h-1'} ${ACCENTS[this.tone()]}`,
  );
  protected readonly valueSize = computed(() => (this.emphasis() ? 'text-3xl' : 'text-2xl'));
  protected readonly frame = computed(() =>
    this.alert()
      ? 'ring-rose-300 bg-rose-50/40 hover:shadow-rose-200/50'
      : 'ring-slate-200/80 bg-white hover:shadow-slate-200/60',
  );
  protected readonly queryParams = computed(() => (this.filter() ? { statut: this.filter() } : {}));
}
