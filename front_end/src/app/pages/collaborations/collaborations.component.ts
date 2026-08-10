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
  imports: [FormsModule, AmountPipe, LocalDatePipe, ModalComponent, IconButtonComponent],
  templateUrl: './collaborations.component.html',
  styleUrl: './collaborations.component.css',
})
export class CollaborationsComponent {
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
    const result = this.editedId
      ? this.service.update(this.editedId, this.form)
      : this.service.create(this.form);

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.message.set(
      this.i18n.t(this.editedId ? 'collaborations.flash.updated' : 'collaborations.flash.created'),
    );
    this.modal.set(null);
  }

  protected advance(collaboration: CollaborationView): void {
    const result = this.service.advance(collaboration.id);
    this.message.set(
      result.ok
        ? this.i18n.t('collaborations.flash.advanced', {
            stage: this.i18n.stage(result.value ?? collaboration.stage),
          })
        : this.i18n.error(result),
    );
  }

  protected markLost(collaboration: CollaborationView): void {
    this.service.markLost(collaboration.id);
    this.message.set(this.i18n.t('collaborations.flash.advanced', { stage: this.i18n.stage('LOST') }));
  }

  protected toCampaign(collaboration: CollaborationView): void {
    const result = this.service.toCampaign(collaboration.id);

    if (!result.ok) {
      this.message.set(this.i18n.error(result));
      return;
    }

    this.message.set(this.i18n.t('collaborations.flash.campaign', { name: result.value ?? '' }));
    void this.router.navigate(['/app/campagnes']);
  }

  protected remove(collaboration: CollaborationView): void {
    this.service.remove(collaboration.id);
    this.message.set(this.i18n.t('collaborations.flash.deleted'));
  }

  protected stageLabel(stage: CollaborationStage): string {
    return this.i18n.stage(stage);
  }

  protected close(): void {
    this.modal.set(null);
    this.error.set(null);
  }
}
