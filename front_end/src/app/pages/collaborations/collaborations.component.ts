import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { CollaborationStage } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ModalComponent } from '../../shared/modal/modal.component';
import { WorkspaceRoutes } from '../../core/workspace-routes';
import { ICONS } from '../../shared/icons';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import {
  ActionMenuComponent,
  ActionMenuItem,
} from '../../shared/action-menu/action-menu.component';
import {
  COLLABORATION_TYPES,
  CollaborationDraft,
  CollaborationService,
  CollaborationView,
  EMPTY_COLLABORATION,
  STAGES,
} from './collaboration.service';

/**
 * Suivi des collaborations en amont de la facturation. Le pipeline montre où
 * en est chaque marque : prospection, négociation, contrat, réalisation.
 */
@Component({
  selector: 'app-collaborations',
  imports: [
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    IconButtonComponent,
    PageHeaderComponent,
    ActionMenuComponent,
  ],
  templateUrl: './collaborations.component.html',
  styleUrl: './collaborations.component.css',
})
export class CollaborationsComponent {
  protected readonly icons = ICONS;

  private readonly routes = inject(WorkspaceRoutes);
  private readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(CollaborationService);

  protected readonly brands = this.store.brands.asReadonly();
  protected readonly types = COLLABORATION_TYPES;
  protected readonly stages = STAGES;

  protected readonly modal = signal<'form' | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected editedId: string | null = null;
  protected form: CollaborationDraft = { ...EMPTY_COLLABORATION };

  protected readonly lostCount = computed(() => this.service.lost().length);

  protected openCreate(): void {
    this.editedId = null;
    this.form = { ...EMPTY_COLLABORATION, brandId: this.brands()[0]?.id ?? '' };
    this.error.set(null);
    this.modal.set('form');
  }

  protected openEdit(collaboration: CollaborationView): void {
    this.editedId = collaboration.id;
    this.form = {
      brandId: collaboration.brandId,
      title: collaboration.title,
      type: collaboration.type,
      stage: collaboration.stage,
      estimatedAmount: collaboration.estimatedAmount,
      contactDate: collaboration.contactDate,
      nextStepDate: collaboration.nextStepDate,
      nextStepNote: collaboration.nextStepNote,
      notes: collaboration.notes,
    };
    this.error.set(null);
    this.modal.set('form');
  }

  protected save(): void {
    const edited = this.editedId;
    const request = edited
      ? this.service.update(edited, this.form)
      : this.service.create(this.form);

    request.subscribe((result) => {
      if (!result.ok) {
        this.error.set(this.i18n.error(result));
        return;
      }

      this.message.set(
        this.i18n.t(edited ? 'collaborations.flash.updated' : 'collaborations.flash.created'),
      );
      this.modal.set(null);
    });
  }

  protected advance(collaboration: CollaborationView): void {
    this.service.advance(collaboration.id).subscribe((result) => {
      this.message.set(
        result.ok
          ? this.i18n.t('collaborations.flash.advanced', {
              stage: this.i18n.stage(result.value ?? collaboration.stage),
            })
          : this.i18n.error(result),
      );
    });
  }

  protected markLost(collaboration: CollaborationView): void {
    this.service.markLost(collaboration.id).subscribe((result) => {
      this.message.set(
        result.ok
          ? this.i18n.t('collaborations.flash.advanced', { stage: this.i18n.stage('LOST') })
          : this.i18n.error(result),
      );
    });
  }

  protected toCampaign(collaboration: CollaborationView): void {
    this.service.toCampaign(collaboration.id).subscribe((result) => {
      if (!result.ok) {
        this.message.set(this.i18n.error(result));
        return;
      }

      this.message.set(this.i18n.t('collaborations.flash.campaign', { name: result.value ?? '' }));
      void this.router.navigate(this.routes.to('campagnes'));
    });
  }

  /**
   * Actions secondaires d'une collaboration. La carte du pipeline est
   * étroite : elle ne garde que le geste qui fait avancer l'affaire, le
   * reste se déplie à la demande.
   */
  protected secondaryActions(item: CollaborationView): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        icon: 'edit',
        label: this.i18n.t('common.edit'),
        run: () => this.openEdit(item),
      },
    ];

    if (!item.campaignId) {
      items.push({
        icon: 'campaigns',
        tone: 'success',
        label: this.i18n.t('collaborations.toCampaign'),
        run: () => this.toCampaign(item),
      });
    }

    if (item.stage !== 'DONE') {
      items.push({
        icon: 'refuse',
        label: this.i18n.t('collaborations.markLost'),
        run: () => this.markLost(item),
      });
    }

    items.push({
      icon: 'delete',
      tone: 'danger',
      label: this.i18n.t('common.delete'),
      run: () => this.remove(item),
    });

    return items;
  }

  protected remove(collaboration: CollaborationView): void {
    this.service.remove(collaboration.id).subscribe((result) => {
      this.message.set(
        result.ok ? this.i18n.t('collaborations.flash.deleted') : this.i18n.error(result),
      );
    });
  }

  protected stageLabel(stage: CollaborationStage): string {
    return this.i18n.stage(stage);
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }
}
