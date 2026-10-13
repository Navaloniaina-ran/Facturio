import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  DEFAULT_ITEMS_COLUMNS,
  ItemsColumnKey,
  TemplateAlignment,
} from '../../core/templates/invoice-template.models';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';

const FONTS = ['Inter', 'Georgia', 'Helvetica', 'Times New Roman', 'Courier New'];
const ALIGNMENTS: TemplateAlignment[] = ['left', 'center', 'right'];

/**
 * Panneau de propriétés : couleurs, police et mise en page du modèle, puis
 * réglages du bloc sélectionné. Tout est local jusqu'à l'enregistrement.
 */
@Component({
  selector: 'app-template-properties-panel',
  imports: [FormsModule, IconButtonComponent],
  templateUrl: './template-properties-panel.component.html',
})
export class TemplatePropertiesPanelComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InvoiceTemplateStore);

  protected readonly fonts = FONTS;
  protected readonly alignments = ALIGNMENTS;

  protected readonly theme = computed(
    () => this.store.draft()?.templateJson.settings.theme ?? null,
  );
  protected readonly page = computed(() => this.store.draft()?.templateJson.settings.page ?? null);
  protected readonly block = this.store.selectedBlock;

  protected readonly columns = computed(
    () => this.block()?.settings.columns ?? DEFAULT_ITEMS_COLUMNS,
  );

  protected alignmentLabel(alignment: TemplateAlignment): string {
    return this.i18n.t(`templates.align.${alignment}`);
  }

  protected columnLabel(key: ItemsColumnKey): string {
    return this.i18n.t(`templates.column.${key}`);
  }

  protected blockLabel(): string {
    const block = this.block();
    return block ? this.i18n.t(`templates.block.${block.type}`) : '';
  }

  // ---------- Colonnes du tableau des produits ----------

  protected toggleColumn(key: ItemsColumnKey): void {
    const block = this.block();
    if (block) {
      this.store.toggleColumn(block.id, key);
    }
  }

  protected setColumnAlignment(key: ItemsColumnKey, align: TemplateAlignment): void {
    const block = this.block();
    if (block) {
      this.store.setColumnAlignment(block.id, key, align);
    }
  }

  protected moveColumn(index: number, offset: number): void {
    const block = this.block();
    if (block) {
      this.store.moveColumn(block.id, index, index + offset);
    }
  }

  // ---------- Logo ----------

  protected async pickLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const url = await this.store.uploadLogo(file);
    const block = this.block();
    if (url && block) {
      this.store.updateBlockSettings(block.id, { text: url });
    }
    input.value = '';
  }
}
