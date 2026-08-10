import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TonKpi = 'brand' | 'succes' | 'attention' | 'danger';

const ACCENTS: Record<TonKpi, string> = {
  brand: 'from-brand-500 to-brand-700',
  succes: 'from-emerald-400 to-emerald-600',
  attention: 'from-amber-400 to-amber-600',
  danger: 'from-rose-400 to-rose-600',
};

/**
 * Indicateur du tableau de bord. Toujours cliquable : le cahier des charges
 * exige que chaque indicateur renvoie vers la liste filtrée correspondante (P02).
 */
@Component({
  selector: 'app-carte-kpi',
  imports: [RouterLink],
  templateUrl: './carte-kpi.component.html',
})
export class CarteKpiComponent {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<string>();
  readonly detail = input<string | null>(null);
  readonly ton = input<TonKpi>('brand');
  readonly lien = input.required<string>();
  readonly filtre = input<string | null>(null);

  protected readonly accent = computed(() => ACCENTS[this.ton()]);
  protected readonly parametres = computed(() => (this.filtre() ? { statut: this.filtre() } : {}));
}
