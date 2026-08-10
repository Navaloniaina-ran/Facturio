import { Injectable, computed, inject } from '@angular/core';
import { DEFAULT_VAT_RATE, addDays, round, today } from '../../core/calculations';
import {
  ActionResult,
  Collaboration,
  CollaborationStage,
  CollaborationType,
} from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { CampaignService } from '../campaigns/campaign.service';

export interface CollaborationView extends Collaboration {
  brandName: string;
  campaignName: string | null;
  /** Vrai lorsque la prochaine action est dépassée. */
  actionDue: boolean;
}

export interface StageColumn {
  stage: CollaborationStage;
  items: CollaborationView[];
  total: number;
}

export type CollaborationDraft = Omit<
  Collaboration,
  'id' | 'campaignId' | 'contractName' | 'stage'
> & { stage: CollaborationStage };

/** Ordre du pipeline : l'étape suivante se déduit de cette liste. */
export const STAGES: CollaborationStage[] = [
  'PROSPECT',
  'NEGOTIATION',
  'CONTRACT',
  'IN_PROGRESS',
  'DONE',
];

export const COLLABORATION_TYPES: CollaborationType[] = [
  'SPONSORED',
  'AMBASSADOR',
  'UGC',
  'EVENT',
  'AFFILIATE',
];

export const EMPTY_COLLABORATION: CollaborationDraft = {
  brandId: '',
  title: '',
  type: 'SPONSORED',
  stage: 'PROSPECT',
  estimatedAmount: 0,
  contactDate: today(),
  nextStepDate: addDays(today(), 7),
  nextStepNote: '',
  notes: '',
};

/**
 * Suivi des collaborations en amont de la facturation : prospection,
 * négociation, contrat, réalisation. Une collaboration signée devient
 * une campagne, qui porte ensuite les livrables et la facture.
 */
@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private readonly store = inject(WorkspaceStore);
  private readonly campaigns = inject(CampaignService);

  readonly list = computed<CollaborationView[]>(() =>
    this.store
      .collaborations()
      .map((collaboration) => ({
        ...collaboration,
        brandName: this.store.brandName(collaboration.brandId),
        campaignName: this.store.campaign(collaboration.campaignId)?.name ?? null,
        actionDue:
          collaboration.nextStepDate !== null &&
          collaboration.nextStepDate <= today() &&
          collaboration.stage !== 'DONE' &&
          collaboration.stage !== 'LOST',
      }))
      .sort((a, b) => b.contactDate.localeCompare(a.contactDate)),
  );

  /** Le pipeline, colonne par colonne. */
  readonly pipeline = computed<StageColumn[]>(() =>
    STAGES.map((stage) => {
      const items = this.list().filter((collaboration) => collaboration.stage === stage);
      return {
        stage,
        items,
        total: round(items.reduce((sum, item) => sum + item.estimatedAmount, 0)),
      };
    }),
  );

  readonly lost = computed(() => this.list().filter((item) => item.stage === 'LOST'));

  /** Valeur des collaborations encore ouvertes. */
  readonly pipelineValue = computed(() =>
    round(
      this.list()
        .filter((item) => item.stage !== 'DONE' && item.stage !== 'LOST')
        .reduce((sum, item) => sum + item.estimatedAmount, 0),
    ),
  );

  readonly negotiationValue = computed(() =>
    round(
      this.list()
        .filter((item) => item.stage === 'NEGOTIATION')
        .reduce((sum, item) => sum + item.estimatedAmount, 0),
    ),
  );

  readonly wonCount = computed(() => this.list().filter((item) => item.stage === 'DONE').length);

  /** Actions à mener, la plus urgente d'abord. */
  readonly nextActions = computed(() =>
    this.list()
      .filter((item) => item.nextStepDate !== null && item.stage !== 'DONE' && item.stage !== 'LOST')
      .sort((a, b) => (a.nextStepDate ?? '').localeCompare(b.nextStepDate ?? ''))
      .slice(0, 5),
  );

  byId(id: string): CollaborationView | undefined {
    return this.list().find((collaboration) => collaboration.id === id);
  }

  create(draft: CollaborationDraft): ActionResult {
    if (!draft.brandId || !draft.title.trim()) {
      return { ok: false, errorKey: 'collaboration.error.required' };
    }

    const collaboration: Collaboration = {
      ...draft,
      id: this.store.newId('k'),
      campaignId: null,
      contractName: null,
    };

    this.store.collaborations.update((list) => [collaboration, ...list]);
    this.store.log('COLLABORATION', 'collaborations.flash.created');
    return { ok: true };
  }

  update(id: string, draft: CollaborationDraft): ActionResult {
    if (!draft.brandId || !draft.title.trim()) {
      return { ok: false, errorKey: 'collaboration.error.required' };
    }

    this.store.collaborations.update((list) =>
      list.map((collaboration) =>
        collaboration.id === id ? { ...collaboration, ...draft } : collaboration,
      ),
    );
    return { ok: true };
  }

  remove(id: string): ActionResult {
    this.store.collaborations.update((list) =>
      list.filter((collaboration) => collaboration.id !== id),
    );
    return { ok: true };
  }

  /** Fait avancer la collaboration d'une étape dans le pipeline. */
  advance(id: string): ActionResult<CollaborationStage> {
    const collaboration = this.byId(id);
    if (!collaboration) {
      return { ok: false, errorKey: 'collaboration.error.notFound' };
    }

    const index = STAGES.indexOf(collaboration.stage);
    const next = STAGES[Math.min(STAGES.length - 1, index + 1)];
    this.setStage(id, next);

    return { ok: true, value: next };
  }

  markLost(id: string): void {
    this.setStage(id, 'LOST');
  }

  setStage(id: string, stage: CollaborationStage): void {
    this.store.collaborations.update((list) =>
      list.map((collaboration) =>
        collaboration.id === id ? { ...collaboration, stage } : collaboration,
      ),
    );
  }

  /**
   * Transforme la collaboration en campagne : un premier livrable est créé à
   * partir du montant estimé, prêt à être détaillé.
   */
  toCampaign(id: string): ActionResult<string> {
    const collaboration = this.byId(id);
    if (!collaboration) {
      return { ok: false, errorKey: 'collaboration.error.notFound' };
    }
    if (collaboration.campaignId) {
      return { ok: false, errorKey: 'collaboration.error.alreadyCampaign' };
    }

    const result = this.campaigns.create({
      brandId: collaboration.brandId,
      name: collaboration.title,
      startDate: today(),
      endDate: addDays(today(), 30),
      deliverables: [
        {
          id: this.store.newId('l'),
          description: collaboration.title,
          deliverableType: collaboration.type === 'UGC' ? 'UGC' : 'POST',
          quantity: 1,
          unitPrice: collaboration.estimatedAmount,
          discountType: 'PERCENT',
          discountValue: 0,
          vatRate: DEFAULT_VAT_RATE,
        },
      ],
    });

    if (!result.ok) {
      return { ok: false, errorKey: result.errorKey, params: result.params };
    }

    const campaign = this.store.campaigns().find((c) => c.name === collaboration.title);
    this.store.collaborations.update((list) =>
      list.map((item) =>
        item.id === id
          ? { ...item, campaignId: campaign?.id ?? null, stage: 'IN_PROGRESS' as CollaborationStage }
          : item,
      ),
    );

    return { ok: true, value: collaboration.title };
  }
}
