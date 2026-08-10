import { Component, input, output } from '@angular/core';

/** Fenêtre modale générique : en-tête, contenu projeté, fermeture au clavier. */
@Component({
  selector: 'app-modale',
  templateUrl: './modale.component.html',
  host: { '(keydown.escape)': 'fermer.emit()' },
})
export class ModaleComponent {
  readonly titre = input.required<string>();
  readonly sousTitre = input<string | null>(null);
  /** Élargit le panneau pour les formulaires à lignes multiples. */
  readonly large = input(false);

  readonly fermer = output<void>();
}
