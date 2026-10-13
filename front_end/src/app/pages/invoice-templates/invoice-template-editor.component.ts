import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { InvoiceTemplateApi } from '../../core/templates/invoice-template.api';
import { InvoiceTemplateStore } from '../../core/templates/invoice-template.store';
import { ToastService } from '../../core/toast.service';
import { InvoiceTemplatePreviewComponent } from '../../shared/invoice-template-preview/invoice-template-preview.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { InvoiceService } from '../invoices/invoice.service';
import { TemplateBlocksPanelComponent } from './template-blocks-panel.component';
import { TemplatePropertiesPanelComponent } from './template-properties-panel.component';
import { WorkspaceRoutes } from '../../core/workspace-routes';

type Drawer = 'blocks' | 'properties' | null;

/**
 * Éditeur visuel : blocs à gauche, aperçu au centre, propriétés à droite.
 * Sur mobile, les deux panneaux deviennent des tiroirs et l'aperçu reste
 * au centre. Toute l'édition est locale ; « Enregistrer » envoie le JSON.
 */
@Component({
  selector: 'app-invoice-template-editor',
  imports: [
    FormsModule,
    ModalComponent,
    InvoiceTemplatePreviewComponent,
    TemplateBlocksPanelComponent,
    TemplatePropertiesPanelComponent,
  ],
  templateUrl: './invoice-template-editor.component.html',
  styleUrl: './invoice-template-editor.component.css',
})
export class InvoiceTemplateEditorComponent {
  private readonly routes = inject(WorkspaceRoutes);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(InvoiceTemplateApi);
  private readonly invoices = inject(InvoiceService);
  private readonly toasts = inject(ToastService);
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InvoiceTemplateStore);

  protected readonly drawer = signal<Drawer>(null);
  protected readonly fullPreview = signal(false);
  protected readonly notFound = signal(false);
  protected readonly downloading = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    void this.load(id);
  }

  private async load(id: string): Promise<void> {
    const template = await this.store.loadOne(id);
    this.notFound.set(template === null);
  }

  protected openDrawer(drawer: Drawer): void {
    this.drawer.set(drawer);
  }

  protected closeDrawer(): void {
    this.drawer.set(null);
  }

  protected async save(): Promise<void> {
    await this.store.save();
  }

  protected cancel(): void {
    this.store.discard();
    void this.router.navigate(this.routes.to('modeles'));
  }

  protected toggleAutoSave(enabled: boolean): void {
    this.store.setAutoSave(enabled);
  }

  /** Le PDF est produit par le backend, à partir du modèle et d'une facture. */
  protected async downloadPdf(): Promise<void> {
    const template = this.store.draft();
    const specimen = this.invoices.list().find((invoice) => invoice.status !== 'DRAFT');

    if (!template || !specimen) {
      this.toasts.info(this.i18n.t('templates.pdfNoInvoice'));
      return;
    }

    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.api.downloadPdf(specimen.id, template.id));
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${specimen.number}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // L'intercepteur a déjà notifié l'erreur ; on reste sur l'écran.
      this.toasts.info(this.i18n.t('templates.pdfUnavailable'));
    } finally {
      this.downloading.set(false);
    }
  }
}
