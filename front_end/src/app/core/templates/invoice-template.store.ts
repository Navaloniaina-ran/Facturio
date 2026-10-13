import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { ToastService } from '../toast.service';
import { InvoiceTemplateApi } from './invoice-template.api';
import {
  ItemsColumn,
  ItemsColumnKey,
  InvoiceTemplate,
  InvoiceTemplateBlock,
  InvoiceTemplateBlockSettings,
  InvoiceTemplatePage,
  InvoiceTemplateTheme,
  TemplateAlignment,
  TemplateBlockType,
} from './invoice-template.models';
import { createTemplateDocument, defaultBlock, presetTemplates } from './invoice-template.presets';

/** Délai avant enregistrement automatique, en millisecondes. */
export const AUTOSAVE_DELAY = 1500;

/**
 * État des modèles de facture.
 *
 * Toutes les manipulations d'édition — glisser-déposer, couleurs, police,
 * visibilité, ordre — restent locales et ne déclenchent aucune requête.
 * Seul `save()` envoie le JSON complet au backend.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceTemplateStore {
  private readonly api = inject(InvoiceTemplateApi);
  private readonly toasts = inject(ToastService);
  private readonly i18n = inject(I18nService);

  private readonly items = signal<InvoiceTemplate[]>([]);
  private readonly draftSignal = signal<InvoiceTemplate | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly dirtySignal = signal(false);
  private readonly offlineSignal = signal(false);
  private readonly savedAtSignal = signal<string | null>(null);
  private readonly selectedBlockSignal = signal<string | null>(null);
  private readonly autoSaveSignal = signal(false);

  private autosaveHandle: number | null = null;

  readonly templates = this.items.asReadonly();
  readonly draft = this.draftSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly dirty = this.dirtySignal.asReadonly();
  /** Vrai lorsque l'API n'a pas répondu : les modèles fournis prennent le relais. */
  readonly offline = this.offlineSignal.asReadonly();
  readonly savedAt = this.savedAtSignal.asReadonly();
  readonly selectedBlockId = this.selectedBlockSignal.asReadonly();
  readonly autoSave = this.autoSaveSignal.asReadonly();

  readonly defaultTemplate = computed(() => this.items().find((item) => item.isDefault) ?? null);

  readonly selectedBlock = computed<InvoiceTemplateBlock | null>(() => {
    const id = this.selectedBlockSignal();
    return this.draftSignal()?.templateJson.blocks.find((block) => block.id === id) ?? null;
  });

  // ---------- Lecture ----------

  async loadAll(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const templates = await firstValueFrom(this.api.getTemplates());
      this.items.set(templates);
      this.offlineSignal.set(false);
    } catch {
      // L'écran reste utilisable : on sert les modèles de la plateforme.
      this.items.set(presetTemplates());
      this.offlineSignal.set(true);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadOne(id: string): Promise<InvoiceTemplate | null> {
    this.loadingSignal.set(true);
    try {
      const template = await firstValueFrom(this.api.getTemplate(id));
      this.offlineSignal.set(false);
      this.startEditing(template);
      return template;
    } catch {
      this.offlineSignal.set(true);
      if (!this.items().length) {
        this.items.set(presetTemplates());
      }
      const local = this.items().find((item) => item.id === id) ?? null;
      if (local) {
        this.startEditing(local);
      }
      return local;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /** Copie de travail : l'original n'est touché qu'à l'enregistrement. */
  startEditing(template: InvoiceTemplate): void {
    this.draftSignal.set(structuredClone(template));
    this.dirtySignal.set(false);
    this.savedAtSignal.set(null);
    this.selectedBlockSignal.set(template.templateJson.blocks[0]?.id ?? null);
  }

  discard(): void {
    const current = this.draftSignal();
    if (!current) {
      return;
    }
    const original = this.items().find((item) => item.id === current.id);
    if (original) {
      this.startEditing(original);
    }
  }

  // ---------- Édition locale ----------

  rename(name: string): void {
    this.mutate((template) => ({ ...template, name }));
  }

  selectBlock(id: string | null): void {
    this.selectedBlockSignal.set(id);
  }

  addBlock(type: TemplateBlockType, index?: number): void {
    this.mutateBlocks((blocks) => {
      const block = defaultBlock(type, blocks.length);
      // Un identifiant unique même si le type est déjà présent deux fois.
      block.id = `${type}-${Date.now()}-${blocks.length}`;
      const next = [...blocks];
      next.splice(index ?? next.length, 0, block);
      this.selectedBlockSignal.set(block.id);
      return next;
    });
  }

  removeBlock(id: string): void {
    this.mutateBlocks((blocks) => blocks.filter((block) => block.id !== id));
    if (this.selectedBlockSignal() === id) {
      this.selectedBlockSignal.set(this.draftSignal()?.templateJson.blocks[0]?.id ?? null);
    }
  }

  toggleBlock(id: string): void {
    this.mutateBlocks((blocks) =>
      blocks.map((block) => (block.id === id ? { ...block, visible: !block.visible } : block)),
    );
  }

  /** Déplacement par glisser-déposer comme au clavier. */
  moveBlock(from: number, to: number): void {
    this.mutateBlocks((blocks) => {
      if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) {
        return blocks;
      }
      const next = [...blocks];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  updateBlockSettings(id: string, settings: Partial<InvoiceTemplateBlockSettings>): void {
    this.mutateBlocks((blocks) =>
      blocks.map((block) =>
        block.id === id ? { ...block, settings: { ...block.settings, ...settings } } : block,
      ),
    );
  }

  updateTheme(theme: Partial<InvoiceTemplateTheme>): void {
    this.mutate((template) => ({
      ...template,
      templateJson: {
        ...template.templateJson,
        settings: {
          ...template.templateJson.settings,
          theme: { ...template.templateJson.settings.theme, ...theme },
        },
      },
    }));
  }

  updatePage(page: Partial<InvoiceTemplatePage>): void {
    this.mutate((template) => ({
      ...template,
      templateJson: {
        ...template.templateJson,
        settings: {
          ...template.templateJson.settings,
          page: { ...template.templateJson.settings.page, ...page },
        },
      },
    }));
  }

  // ---------- Colonnes du tableau des produits ----------

  private mutateColumns(blockId: string, change: (columns: ItemsColumn[]) => ItemsColumn[]): void {
    const block = this.draftSignal()?.templateJson.blocks.find((item) => item.id === blockId);
    const columns = block?.settings.columns ?? [];
    this.updateBlockSettings(blockId, {
      columns: change(columns.map((column) => ({ ...column }))),
    });
  }

  toggleColumn(blockId: string, key: ItemsColumnKey): void {
    this.mutateColumns(blockId, (columns) =>
      columns.map((column) =>
        column.key === key ? { ...column, visible: !column.visible } : column,
      ),
    );
  }

  setColumnAlignment(blockId: string, key: ItemsColumnKey, align: TemplateAlignment): void {
    this.mutateColumns(blockId, (columns) =>
      columns.map((column) => (column.key === key ? { ...column, align } : column)),
    );
  }

  moveColumn(blockId: string, from: number, to: number): void {
    this.mutateColumns(blockId, (columns) => {
      if (from === to || to < 0 || to >= columns.length) {
        return columns;
      }
      const next = [...columns];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // ---------- Écriture ----------

  setAutoSave(enabled: boolean): void {
    this.autoSaveSignal.set(enabled);
    if (enabled && this.dirtySignal()) {
      this.scheduleAutoSave();
    }
  }

  async save(): Promise<boolean> {
    const template = this.draftSignal();
    if (!template) {
      return false;
    }

    this.savingSignal.set(true);
    const payload = { name: template.name, templateJson: template.templateJson };

    try {
      const saved = await firstValueFrom(this.api.updateTemplate(template.id, payload));
      this.replace(saved);
      this.draftSignal.set(structuredClone(saved));
      this.dirtySignal.set(false);
      this.savedAtSignal.set(new Date().toISOString());
      this.offlineSignal.set(false);
      this.toasts.success(this.i18n.t('templates.flash.saved'));
      return true;
    } catch {
      // Hors ligne : la modification reste en mémoire, l'utilisateur est averti.
      this.replace(template);
      this.dirtySignal.set(false);
      this.savedAtSignal.set(new Date().toISOString());
      this.offlineSignal.set(true);
      this.toasts.info(this.i18n.t('templates.flash.savedOffline'));
      return false;
    } finally {
      this.savingSignal.set(false);
    }
  }

  async create(name: string, presetKey?: string): Promise<InvoiceTemplate | null> {
    const preset = presetKey
      ? presetTemplates().find((item) => item.id === `preset-${presetKey}`)
      : undefined;
    const document = preset ? structuredClone(preset.templateJson) : createTemplateDocument();
    const payload = { name, templateJson: document };

    try {
      const created = await firstValueFrom(this.api.createTemplate(payload));
      this.items.update((list) => [created, ...list]);
      this.offlineSignal.set(false);
      this.toasts.success(this.i18n.t('templates.flash.created'));
      return created;
    } catch {
      const local: InvoiceTemplate = {
        id: `local-${Date.now()}`,
        name,
        isDefault: false,
        updatedAt: new Date().toISOString(),
        templateJson: document,
      };
      this.items.update((list) => [local, ...list]);
      this.offlineSignal.set(true);
      this.toasts.info(this.i18n.t('templates.flash.createdOffline'));
      return local;
    }
  }

  async duplicate(id: string): Promise<void> {
    try {
      const copy = await firstValueFrom(this.api.duplicateTemplate(id));
      this.items.update((list) => [copy, ...list]);
      this.toasts.success(this.i18n.t('templates.flash.duplicated'));
    } catch {
      const source = this.items().find((item) => item.id === id);
      if (!source) {
        return;
      }
      const copy: InvoiceTemplate = {
        ...structuredClone(source),
        id: `local-${Date.now()}`,
        name: this.i18n.t('templates.copyName', { name: source.name }),
        isDefault: false,
        isPreset: false,
      };
      this.items.update((list) => [copy, ...list]);
      this.offlineSignal.set(true);
      this.toasts.info(this.i18n.t('templates.flash.duplicated'));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteTemplate(id));
      this.toasts.success(this.i18n.t('templates.flash.deleted'));
    } catch {
      this.offlineSignal.set(true);
      this.toasts.info(this.i18n.t('templates.flash.deleted'));
    }
    this.items.update((list) => list.filter((item) => item.id !== id));
  }

  async setDefault(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.setDefaultTemplate(id));
      this.toasts.success(this.i18n.t('templates.flash.default'));
    } catch {
      this.offlineSignal.set(true);
      this.toasts.info(this.i18n.t('templates.flash.default'));
    }
    this.items.update((list) => list.map((item) => ({ ...item, isDefault: item.id === id })));
  }

  /** Le logo passe par le backend ; l'URL renvoyée est stockée dans le modèle. */
  async uploadLogo(file: File): Promise<string | null> {
    const template = this.draftSignal();
    if (!template) {
      return null;
    }

    try {
      const uploaded = await firstValueFrom(this.api.uploadLogo(template.id, file));
      this.toasts.success(this.i18n.t('templates.flash.logo'));
      return uploaded.url;
    } catch {
      this.offlineSignal.set(true);
      this.toasts.error(this.i18n.t('templates.flash.logoFailed'));
      return null;
    }
  }

  // ---------- Interne ----------

  private replace(template: InvoiceTemplate): void {
    this.items.update((list) => {
      const exists = list.some((item) => item.id === template.id);
      return exists
        ? list.map((item) => (item.id === template.id ? template : item))
        : [template, ...list];
    });
  }

  private mutate(change: (template: InvoiceTemplate) => InvoiceTemplate): void {
    const current = this.draftSignal();
    if (!current) {
      return;
    }
    this.draftSignal.set(change(current));
    this.markDirty();
  }

  private mutateBlocks(change: (blocks: InvoiceTemplateBlock[]) => InvoiceTemplateBlock[]): void {
    this.mutate((template) => ({
      ...template,
      templateJson: { ...template.templateJson, blocks: change(template.templateJson.blocks) },
    }));
  }

  private markDirty(): void {
    this.dirtySignal.set(true);
    this.savedAtSignal.set(null);
    if (this.autoSaveSignal()) {
      this.scheduleAutoSave();
    }
  }

  private scheduleAutoSave(): void {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.autosaveHandle !== null) {
      window.clearTimeout(this.autosaveHandle);
    }
    this.autosaveHandle = window.setTimeout(() => {
      this.autosaveHandle = null;
      void this.save();
    }, AUTOSAVE_DELAY);
  }
}
