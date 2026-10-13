import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

export type ListView = 'table' | 'grid';

/**
 * Bascule entre l'affichage tableau et l'affichage cartes.
 *
 * Le tableau sert à comparer des lignes, les cartes à en lire une. Aucun des
 * deux ne remplace l'autre, d'où le choix laissé à qui consulte.
 */
@Component({
  selector: 'app-view-switch',
  templateUrl: './view-switch.component.html',
})
export class ViewSwitchComponent {
  protected readonly i18n = inject(I18nService);

  readonly value = input.required<ListView>();
  readonly valueChange = output<ListView>();
}
