import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ICONS } from '../icons';

/** Fenêtre modale générique : en-tête figé, corps défilant, fermeture au clavier. */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  host: { '(keydown.escape)': 'closed.emit()' },
})
export class ModalComponent {
  protected readonly icons = ICONS;

  protected readonly i18n = inject(I18nService);

  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  /** Élargit le panneau pour les formulaires à lignes multiples. */
  readonly wide = input(false);

  readonly closed = output<void>();
}
