import { Component, computed, input } from '@angular/core';
import { ALL_ICONS, AnyIconName } from '../icons';

export type HeaderTone = 'brand' | 'sky' | 'emerald' | 'amber' | 'rose';

/** Dégradés de la tuile d'icône, un par famille de page. */
const TONES: Record<HeaderTone, string> = {
  brand: 'from-brand-500 to-brand-700 shadow-brand-600/25',
  sky: 'from-sky-500 to-sky-700 shadow-sky-600/25',
  emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-600/25',
  amber: 'from-amber-500 to-amber-600 shadow-amber-600/25',
  rose: 'from-rose-500 to-rose-700 shadow-rose-600/25',
};

const HALOS: Record<HeaderTone, string> = {
  brand: 'bg-brand-500/10',
  sky: 'bg-sky-500/10',
  emerald: 'bg-emerald-500/10',
  amber: 'bg-amber-500/10',
  rose: 'bg-rose-500/10',
};

/**
 * En-tête de page : une tuile d'icône, le titre, ce que la page contient, et
 * les actions principales projetées à droite.
 *
 * Le motif venait de la page Marques, où il était écrit à la main. L'extraire
 * évite de le recopier sur chaque écran — et garantit que le jour où l'en-tête
 * change, il change partout.
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  readonly icon = input.required<AnyIconName>();
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly tone = input<HeaderTone>('brand');

  protected readonly icons = ALL_ICONS;
  protected readonly tile = computed(() => TONES[this.tone()]);
  protected readonly halo = computed(() => HALOS[this.tone()]);
}
