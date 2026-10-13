import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { apiErrorResult } from '../../core/api/api-error';
import { CreatorApiService } from '../../core/api/creator-api.service';
import { DEFAULT_VAT_RATE, addDays, round, today } from '../../core/calculations';
import {
  ActionResult,
  Collaboration,
  CollaborationStage,
  CollaborationType,
  Line,
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
  private readonly api = inject(CreatorApiService);

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
      .filter(
        (item) => item.nextStepDate !== null && item.stage !== 'DONE' && item.stage !== 'LOST',
      )
      .sort((a, b) => (a.nextStepDate ?? '').localeCompare(b.nextStepDate ?? ''))
      .slice(0, 5),
  );

  byId(id: string): CollaborationView | undefined {
    return this.list().find((collaboration) => collaboration.id === id);
  }

  create(draft: CollaborationDraft): Observable<ActionResult> {
    if (!draft.brandId || !draft.title.trim()) {
      return of({ ok: false, errorKey: 'collaboration.error.required' });
    }

    if (!this.store.remote()) {
      this.add({ ...draft, id: this.store.newId('k'), campaignId: null, contractName: null });
      return of({ ok: true });
    }

    return this.api.createCollaboration(draft).pipe(
      tap((collaboration) => this.add(collaboration)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  update(id: string, draft: CollaborationDraft): Observable<ActionResult> {
    if (!draft.brandId || !draft.title.trim()) {
      return of({ ok: false, errorKey: 'collaboration.error.required' });
    }

    if (!this.store.remote()) {
      this.replace(id, (collaboration) => ({ ...collaboration, ...draft }));
      return of({ ok: true });
    }

    return this.api.updateCollaboration(id, draft).pipe(
      tap((collaboration) => this.replace(id, () => collaboration)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  remove(id: string): Observable<ActionResult> {
    if (!this.store.remote()) {
      this.drop(id);
      return of({ ok: true });
    }

    return this.api.deleteCollaboration(id).pipe(
      tap(() => this.drop(id)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  /** Fait avancer la collaboration d'une étape dans le pipeline. */
  advance(id: string): Observable<ActionResult<CollaborationStage>> {
    const collaboration = this.byId(id);
    if (!collaboration) {
      return of({ ok: false, errorKey: 'collaboration.error.notFound' });
    }

    const index = STAGES.indexOf(collaboration.stage);
    const next = STAGES[Math.min(STAGES.length - 1, index + 1)];

    return this.setStage(id, next).pipe(
      map<ActionResult, ActionResult<CollaborationStage>>((result) =>
        result.ok ? { ok: true, value: next } : { ...result, value: undefined },
      ),
    );
  }

  markLost(id: string): Observable<ActionResult> {
    return this.setStage(id, 'LOST');
  }

  setStage(id: string, stage: CollaborationStage): Observable<ActionResult> {
    if (!this.store.remote()) {
      this.replace(id, (collaboration) => ({ ...collaboration, stage }));
      return of({ ok: true });
    }

    return this.api.changeCollaborationStage(id, stage).pipe(
      tap((collaboration) => this.replace(id, () => collaboration)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  private add(collaboration: Collaboration): void {
    this.store.collaborations.update((list) => [collaboration, ...list]);
    this.store.log('COLLABORATION', 'collaborations.flash.created');
  }

  private replace(id: string, change: (item: Collaboration) => Collaboration): void {
    this.store.collaborations.update((list) =>
      list.map((collaboration) =>
        collaboration.id === id ? change(collaboration) : collaboration,
      ),
    );
  }

  private drop(id: string): void {
    this.store.collaborations.update((list) =>
      list.filter((collaboration) => collaboration.id !== id),
    );
  }

  /**
   * Transforme la collaboration en campagne : un premier livrable est créé à
   * partir du montant estimé, prêt à être détaillé.
   */
  toCampaign(id: string): Observable<ActionResult<string>> {
    const collaboration = this.byId(id);
    if (!collaboration) {
      return of({ ok: false, errorKey: 'collaboration.error.notFound' });
    }
    if (collaboration.campaignId) {
      return of({ ok: false, errorKey: 'collaboration.error.alreadyCampaign' });
    }

    const deliverables: Line[] = [
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
    ];
    const startDate = today();
    const endDate = addDays(startDate, 30);

    if (!this.store.remote()) {
      return this.campaigns
        .create({
          brandId: collaboration.brandId,
          name: collaboration.title,
          startDate,
          endDate,
          deliverables,
        })
        .pipe(
          switchMap((result) => {
            if (!result.ok) {
              return of({ ok: false, errorKey: result.errorKey, params: result.params });
            }

            const campaign = this.store.campaigns().find((c) => c.name === collaboration.title);
            this.link(id, campaign?.id ?? null);
            return of({ ok: true, value: collaboration.title });
          }),
        );
    }

    // Le backend crée la campagne, pose le lien et passe la collaboration en
    // réalisation : une seule écriture, pas de risque d'état intermédiaire.
    return this.api
      .collaborationToCampaign(id, {
        name: collaboration.title,
        startDate,
        endDate,
        deliverables,
      })
      .pipe(
        tap((campaign) => {
          this.store.campaigns.update((list) => [campaign, ...list]);
          this.link(id, campaign.id);
        }),
        map(() => ({ ok: true, value: collaboration.title }) as ActionResult<string>),
        catchError((error: HttpErrorResponse) =>
          of(
            apiErrorResult(error, {
              collaboration_already_campaign: 'collaboration.error.alreadyCampaign',
            }),
          ),
        ),
      );
  }

  /** Rattache la campagne créée et bascule la collaboration en réalisation. */
  private link(id: string, campaignId: string | null): void {
    this.replace(id, (collaboration) => ({
      ...collaboration,
      campaignId,
      stage: 'IN_PROGRESS' as CollaborationStage,
    }));
  }
}
