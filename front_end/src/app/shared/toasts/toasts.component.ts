import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast.service';
import { ICONS } from '../icons';

/** Pile de notifications, montée une seule fois dans la coquille applicative. */
@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
})
export class ToastsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ToastService);
  protected readonly icons = ICONS;

  protected toneClass(tone: string): string {
    if (tone === 'error') {
      return 'bg-rose-600 text-white';
    }
    return tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white';
  }
}
