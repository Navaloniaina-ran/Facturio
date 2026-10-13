import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  TEMPLATE_BLOCK_TYPES,
  TemplateBlockType,
} from '../../core/templates/invoice-template.models';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';

/**
 * Panneau des blocs : palette à gauche, composition du document à droite.
 *
 * Le glisser-déposer utilise l'API HTML5 native — aucune dépendance ajoutée —
 * et chaque déplacement reste accessible au clavier par les boutons ↑ / ↓.
 */
@Component({
  selector: 'app-template-blocks-panel',
  imports: [IconButtonComponent],
  templateUrl: './template-blocks-panel.component.html',
})
export class TemplateBlocksPanelComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InvoiceTemplateStore);

  protected readonly palette = TEMPLATE_BLOCK_TYPES;

  /** Index du bloc en cours de déplacement, ou null si l'on ajoute un type. */
  private readonly draggedIndex = signal<number | null>(null);
  private readonly draggedType = signal<TemplateBlockType | null>(null);
  protected readonly dropIndex = signal<number | null>(null);

  protected readonly blocks = computed(() => this.store.draft()?.templateJson.blocks ?? []);

  protected label(type: TemplateBlockType): string {
    return this.i18n.t(`templates.block.${type}`);
  }

  // ---------- Glisser-déposer ----------

  protected startDragType(type: TemplateBlockType, event: DragEvent): void {
    this.draggedType.set(type);
    this.draggedIndex.set(null);
    event.dataTransfer?.setData('text/plain', type);
  }

  protected startDragBlock(index: number, event: DragEvent): void {
    this.draggedIndex.set(index);
    this.draggedType.set(null);
    event.dataTransfer?.setData('text/plain', String(index));
  }

  protected over(index: number, event: DragEvent): void {
    event.preventDefault();
    this.dropIndex.set(index);
  }

  protected drop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.draggedIndex();
    const type = this.draggedType();

    if (from !== null) {
      this.store.moveBlock(from, index);
    } else if (type) {
      this.store.addBlock(type, index);
    }

    this.endDrag();
  }

  /** Dépôt en fin de liste. */
  protected dropAtEnd(event: DragEvent): void {
    event.preventDefault();
    const from = this.draggedIndex();
    const type = this.draggedType();

    if (from !== null) {
      this.store.moveBlock(from, this.blocks().length - 1);
    } else if (type) {
      this.store.addBlock(type);
    }

    this.endDrag();
  }

  protected endDrag(): void {
    this.draggedIndex.set(null);
    this.draggedType.set(null);
    this.dropIndex.set(null);
  }

  // ---------- Clavier ----------

  protected moveUp(index: number): void {
    this.store.moveBlock(index, index - 1);
  }

  protected moveDown(index: number): void {
    this.store.moveBlock(index, index + 1);
  }

  protected add(type: TemplateBlockType): void {
    this.store.addBlock(type);
  }
}
