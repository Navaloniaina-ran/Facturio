import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_TAXATION, Taxation, computeTotals } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { DeliverableType, Discount, DiscountType, Line } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../amount.pipe';
import { ICONS } from '../icons';

const TYPES: DeliverableType[] = ['REEL', 'STORY', 'POST', 'VIDEO', 'UGC', 'EVENT'];
const DISCOUNT_TYPES: DiscountType[] = ['PERCENT', 'AMOUNT'];

/**
 * Éditeur de lignes de prestation partagé par les propositions, les factures
 * et les campagnes.
 *
 * La taxation se décide ici, document par document : la TVA est proposée par
 * défaut, peut être retirée, et d'autres taxes peuvent s'ajouter (retenue à la
 * source, taxe locale…). Chaque remise s'exprime en pourcentage ou en montant.
 */
@Component({
  selector: 'app-line-editor',
  imports: [FormsModule, AmountPipe],
  templateUrl: './line-editor.component.html',
  styleUrl: './line-editor.component.css',
})
export class LineEditorComponent {
  private readonly store = inject(WorkspaceStore);
  protected readonly i18n = inject(I18nService);
  protected readonly icons = ICONS;

  /** Tableau modifié sur place par le parent : les objets sont partagés. */
  readonly lines = input.required<Line[]>();
  /** Remise globale, également modifiée sur place. */
  readonly globalDiscount = input<Discount | null>(null);
  /** Régime de taxation du document, modifié sur place. */
  readonly taxation = input<Taxation | null>(null);
  readonly title = input('');

  readonly add = output<void>();
  readonly remove = output<string>();
  readonly addTax = output<void>();
  readonly removeTax = output<string>();

  protected readonly types = TYPES;
  protected readonly discountTypes = DISCOUNT_TYPES;

  /** Symbole affiché dans le sélecteur de remise, selon le type choisi. */
  protected discountSymbol(type: DiscountType): string {
    return type === 'PERCENT' ? '%' : this.store.currency();
  }

  /** Appelé depuis le gabarit : reflète l'état courant des champs saisis. */
  protected totals() {
    return computeTotals(this.lines(), this.globalDiscount() ?? undefined, this.regime());
  }

  protected regime(): Taxation {
    return this.taxation() ?? DEFAULT_TAXATION;
  }
}
