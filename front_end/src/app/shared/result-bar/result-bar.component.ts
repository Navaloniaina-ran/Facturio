import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ICONS } from '../icons';

/** Une contrainte active, retirable d'un clic. */
export interface FilterChip {
  label: string;
  tone?: 'brand' | 'neutral';
  clear: () => void;
}

/**
 * Bandeau de résultats posé sous la barre d'outils.
 *
 * Il répond à deux questions qu'une liste filtrée laisse en suspens : combien
 * d'éléments sont montrés sur combien, et qu'est-ce qui les masque. Chaque
 * contrainte est une puce qu'on retire isolément, sans tout réinitialiser.
 */
@Component({
  selector: 'app-result-bar',
  templateUrl: './result-bar.component.html',
})
export class ResultBarComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly icons = ICONS;

  readonly count = input.required<number>();
  readonly total = input.required<number>();
  readonly chips = input<FilterChip[]>([]);

  readonly reset = output<void>();
}
