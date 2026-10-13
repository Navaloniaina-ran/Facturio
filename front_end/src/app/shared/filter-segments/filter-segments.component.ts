import { Component, input, output } from '@angular/core';

/** Un segment de filtre. `count` s'affiche en pastille quand il est fourni. */
export interface FilterSegment {
  key: string;
  label: string;
  count?: number;
}

/**
 * Segments de filtre chiffrés.
 *
 * L'effectif est annoncé avant le clic : on sait qu'un filtre est vide sans
 * avoir à l'essayer. L'état actif passe par `aria-pressed`, donc le style et
 * ce qu'entend un lecteur d'écran ne peuvent pas diverger.
 */
@Component({
  selector: 'app-filter-segments',
  templateUrl: './filter-segments.component.html',
})
export class FilterSegmentsComponent {
  readonly segments = input.required<FilterSegment[]>();
  readonly active = input.required<string>();
  readonly label = input('');

  readonly select = output<string>();
}
