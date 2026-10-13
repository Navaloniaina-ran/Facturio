import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { InvoiceTemplate } from '../../core/templates/invoice-template.models';
import { templatePresets } from '../../core/templates/invoice-template.presets';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { InvoiceTemplatePreviewComponent } from '../../shared/invoice-template-preview/invoice-template-preview.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';

/** Gestion des modèles de facture : liste, création, duplication, défaut. */
@Component({
  selector: 'app-invoice-templates',
  imports: [
    FormsModule,
    RouterLink,
    LocalDatePipe,
    ModalComponent,
    IconButtonComponent,
    InvoiceTemplatePreviewComponent,
  ],
  templateUrl: './invoice-templates.component.html',
})
export class InvoiceTemplatesComponent {
  protected readonly icons = ICONS;

  protected readonly routes = inject(WorkspaceRoutes);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InvoiceTemplateStore);

  protected readonly presets = templatePresets();
  protected readonly modal = signal<'create' | 'delete' | null>(null);
  protected readonly target = signal<InvoiceTemplate | null>(null);

  protected newName = '';
  protected newPreset = 'modern';

  constructor() {
    void this.store.loadAll();
  }

  protected openCreate(): void {
    this.newName = this.i18n.t('templates.defaultName');
    this.newPreset = 'modern';
    this.modal.set('create');
  }

  protected async create(): Promise<void> {
    const created = await this.store.create(
      this.newName.trim() || this.i18n.t('templates.defaultName'),
      this.newPreset,
    );
    this.modal.set(null);

    if (created) {
      void this.router.navigate(this.routes.to('modeles', created.id, 'edition'));
    }
  }

  protected confirmDelete(template: InvoiceTemplate): void {
    this.target.set(template);
    this.modal.set('delete');
  }

  protected async remove(): Promise<void> {
    const template = this.target();
    if (template) {
      await this.store.remove(template.id);
    }
    this.modal.set(null);
  }

  protected duplicate(template: InvoiceTemplate): void {
    void this.store.duplicate(template.id);
  }

  protected setDefault(template: InvoiceTemplate): void {
    void this.store.setDefault(template.id);
  }

  protected close(): void {
    this.modal.set(null);
  }
}
