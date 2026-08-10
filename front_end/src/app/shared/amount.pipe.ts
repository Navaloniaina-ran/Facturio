import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { WorkspaceStore } from '../core/workspace-store.service';

/**
 * Formate un montant dans la devise de l'espace et la langue courante.
 * Volontairement impur : le format doit suivre un changement de langue
 * sans que chaque gabarit ait à passer la locale en paramètre.
 */
@Pipe({ name: 'amount', pure: false })
export class AmountPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly store = inject(WorkspaceStore);

  transform(value: number | null | undefined, currency?: string): string {
    const amount = value ?? 0;

    return new Intl.NumberFormat(this.i18n.locale(), {
      style: 'currency',
      currency: currency ?? this.store.currency(),
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
}
