import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { ICONS, IconName } from '../icons';
import { IconTone } from '../icon-button/icon-button.component';

/** Une entrée du menu. `run` est appelée puis le menu se referme. */
export interface ActionMenuItem {
  icon: IconName;
  label: string;
  tone?: IconTone;
  run: () => void;
}

/**
 * Menu de débordement des actions secondaires d'une ligne de tableau.
 *
 * Une ligne de facture peut porter dix actions. Alignées, elles forment un mur
 * d'icônes que l'œil ne sait plus lire et qui impose au tableau une largeur
 * dont il n'a pas besoin. Les deux ou trois gestes courants restent donc
 * visibles, le reste vit ici.
 */
@Component({
  selector: 'app-action-menu',
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class ActionMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly i18n = inject(I18nService);
  protected readonly icons = ICONS;

  readonly items = input.required<ActionMenuItem[]>();
  /** Ouvre le panneau vers la gauche : utile en fin de ligne. */
  readonly alignEnd = input(true);

  protected readonly open = signal(false);
  protected readonly visible = computed(() => this.items().filter(Boolean));

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  protected select(item: ActionMenuItem): void {
    this.close();
    item.run();
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Un clic ailleurs referme : le menu ne survit pas à l'attention. */
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
