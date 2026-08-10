import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';

export type DateStyle = 'full' | 'dayMonth';

/**
 * Formate une date ISO selon la langue courante : 12/08/2026 en français,
 * 08/12/2026 en anglais. Impur pour suivre le changement de langue.
 */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | null | undefined, style: DateStyle = 'full'): string {
    if (!value) {
      return '—';
    }

    const options: Intl.DateTimeFormatOptions =
      style === 'dayMonth'
        ? { day: '2-digit', month: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };

    return new Intl.DateTimeFormat(this.i18n.locale(), { ...options, timeZone: 'UTC' }).format(
      new Date(value + 'T00:00:00Z'),
    );
  }
}
