import { Component, computed, input } from '@angular/core';
import { TonStatut, libelleStatut, tonStatut } from '../../core/libelles';

const CLASSES: Record<TonStatut, string> = {
  neutre: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  succes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  attention: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const POINTS: Record<TonStatut, string> = {
  neutre: 'bg-slate-400',
  info: 'bg-sky-500',
  succes: 'bg-emerald-500',
  attention: 'bg-amber-500',
  danger: 'bg-rose-500',
};

/** Badge de statut générique, alimenté par le dictionnaire de libellés. */
@Component({
  selector: 'app-badge-statut',
  templateUrl: './badge-statut.component.html',
})
export class BadgeStatutComponent {
  /** Code du statut, par exemple PARTIELLEMENT_PAYEE. */
  readonly statut = input.required<string>();
  /** Complément affiché entre parenthèses, par exemple « 12 j ». */
  readonly complement = input<string | null>(null);

  protected readonly libelle = computed(() => libelleStatut(this.statut()));
  protected readonly classes = computed(() => CLASSES[tonStatut(this.statut())]);
  protected readonly point = computed(() => POINTS[tonStatut(this.statut())]);
}
