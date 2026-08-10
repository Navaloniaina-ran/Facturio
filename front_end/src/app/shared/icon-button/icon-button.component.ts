import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICONS, IconName } from '../icons';

export type IconTone = 'neutral' | 'brand' | 'success' | 'danger';

/**
 * Action en icône seule. Le libellé traduit sert d'infobulle (`title`) et de
 * nom accessible (`aria-label`) : les colonnes d'actions restent compactes
 * sans rien perdre en lisibilité ni en accessibilité.
 */
@Component({
  selector: 'app-icon-button',
  imports: [RouterLink],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
})
export class IconButtonComponent {
  readonly icon = input.required<IconName>();
  /** Intitulé de l'action, affiché au survol. */
  readonly label = input.required<string>();
  readonly tone = input<IconTone>('neutral');
  /** Renseigné, l'action devient un lien de navigation. */
  readonly link = input<string | null>(null);

  readonly action = output<void>();

  protected readonly path = computed(() => ICONS[this.icon()]);
  protected readonly classes = computed(() => `icon-btn tone-${this.tone()}`);
}
