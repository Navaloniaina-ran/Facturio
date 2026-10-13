import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { apiErrorResult } from '../../core/api/api-error';
import { CreatorApiService } from '../../core/api/creator-api.service';
import { NO_DISCOUNT, addDays, computeTotals, today } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { ActionResult, Campaign, CampaignStatus, Line } from '../../core/models';
import { QUOTAS } from '../../core/quotas';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService, InvoiceView } from '../invoices/invoice.service';
import { QuoteService } from '../quotes/quote.service';

export interface ChainStep {
  labelKey: string;
  done: boolean;
}

export interface CampaignView extends Campaign {
  brandName: string;
  totalExclVat: number;
  totalInclVat: number;
  deliverableCount: number;
  chain: ChainStep[];
  /** Pourcentage d'avancement de la chaîne commerciale. */
  progress: number;
  invoices: InvoiceView[];
}

export interface CampaignDraft {
  brandId: string;
  name: string;
  startDate: string;
  endDate: string;
  deliverables: Line[];
}

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly quotes = inject(QuoteService);
  private readonly api = inject(CreatorApiService);
  private readonly i18n = inject(I18nService);

  /** Le module Campagnes est réservé aux offres PRO et BUSINESS. */
  readonly moduleAllowed = computed(() => QUOTAS[this.store.creator().plan].campaigns);

  readonly list = computed<CampaignView[]>(() =>
    this.store
      .campaigns()
      .map((campaign) => {
        const totals = computeTotals(campaign.deliverables);
        const linked = this.invoices.list().filter((i) => i.campaignId === campaign.id);
        const invoiceIssued = linked.some((i) => i.status !== 'DRAFT');
        const paymentReceived = linked.some((i) => i.paidAmount > 0);

        const chain: ChainStep[] = [
          { labelKey: 'chain.quote', done: campaign.quoteAccepted },
          { labelKey: 'chain.contract', done: campaign.contractSigned },
          { labelKey: 'chain.invoice', done: invoiceIssued },
          { labelKey: 'chain.payment', done: paymentReceived },
        ];

        return {
          ...campaign,
          brandName: this.store.brandName(campaign.brandId),
          totalExclVat: totals.totalExclVat,
          totalInclVat: totals.totalInclVat,
          deliverableCount: campaign.deliverables.reduce((sum, d) => sum + d.quantity, 0),
          chain,
          progress: Math.round((chain.filter((s) => s.done).length / chain.length) * 100),
          invoices: linked,
        };
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
  );

  readonly active = computed(() => this.list().filter((c) => c.status === 'ACTIVE'));

  byId(id: string): CampaignView | undefined {
    return this.list().find((campaign) => campaign.id === id);
  }

  byBrand(brandId: string): CampaignView[] {
    return this.list().filter((campaign) => campaign.brandId === brandId);
  }

  create(draft: CampaignDraft): Observable<ActionResult> {
    if (!draft.brandId || !draft.name.trim()) {
      return of({ ok: false, errorKey: 'campaign.error.required' });
    }
    if (!draft.deliverables.length) {
      return of({ ok: false, errorKey: 'campaign.error.noDeliverable' });
    }

    if (!this.store.remote()) {
      this.add({
        id: this.store.newId('c'),
        brandId: draft.brandId,
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
        status: 'DRAFT',
        deliverables: draft.deliverables,
        contractName: null,
        quoteAccepted: false,
        contractSigned: false,
      });
      return of({ ok: true });
    }

    return this.api.createCampaign(draft).pipe(
      tap((campaign) => this.add(campaign)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  /** Les collaborations sont souvent récurrentes : duplication en un clic. */
  duplicate(id: string): Observable<ActionResult> {
    const source = this.byId(id);
    if (!source) {
      return of({ ok: false, errorKey: 'campaign.error.notFound' });
    }

    if (!this.store.remote()) {
      return this.create({
        brandId: source.brandId,
        name: this.i18n.t('campaign.copySuffix', { name: source.name }),
        startDate: today(),
        endDate: addDays(today(), 30),
        deliverables: source.deliverables.map((d) => ({ ...d, id: this.store.newId('l') })),
      });
    }

    return this.api.duplicateCampaign(id).pipe(
      tap((campaign) => this.add(campaign)),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  /** Génère la proposition de collaboration depuis les livrables de la campagne. */
  generateQuote(id: string): Observable<ActionResult> {
    const campaign = this.byId(id);
    if (!campaign) {
      return of({ ok: false, errorKey: 'campaign.error.notFound' });
    }
    const result = this.quotes.create({
      brandId: campaign.brandId,
      campaignId: campaign.id,
      date: today(),
      expiryDate: addDays(today(), 30),
      terms: this.i18n.t('campaign.quoteTerms', { name: campaign.name }),
      lines: campaign.deliverables.map((d) => ({ ...d, id: this.store.newId('l') })),
      globalDiscount: { ...NO_DISCOUNT },
      vatApplicable: true,
      extraTaxes: [],
      draft: false,
    });

    if (!result.ok) {
      return of({ ok: false, errorKey: result.errorKey, params: result.params });
    }
    return this.setStatus(id, 'PENDING');
  }

  /** La facture se génère depuis la campagne, sans ressaisie (P04). */
  generateInvoice(id: string): Observable<ActionResult<InvoiceView>> {
    const campaign = this.byId(id);
    if (!campaign) {
      return of({ ok: false, errorKey: 'campaign.error.notFound' });
    }
    const result = this.invoices.create({
      brandId: campaign.brandId,
      campaignId: campaign.id,
      quoteId: null,
      issueDate: today(),
      dueDate: this.invoices.defaultDueDate(campaign.brandId),
      depositPercent: 0,
      terms: this.i18n.t('campaign.invoiceTerms', {
        name: campaign.name,
        start: campaign.startDate,
        end: campaign.endDate,
      }),
      lines: campaign.deliverables.map((d) => ({ ...d, id: this.store.newId('l') })),
      globalDiscount: { ...NO_DISCOUNT },
      vatApplicable: true,
      extraTaxes: [],
      draft: false,
    });

    if (!result.ok) {
      return of(result);
    }

    return this.setStatus(id, 'ACTIVE').pipe(map(() => result));
  }

  /**
   * Rattache le contrat signé. L'API ne reçoit pas encore de fichier : le
   * jalon reste tenu par le front tant que le dépôt n'est pas ouvert.
   */
  attachContract(id: string, fileName: string): Observable<ActionResult> {
    if (this.store.remote()) {
      return of({ ok: false, errorKey: 'campaign.error.contractOffline' });
    }

    this.store.campaigns.update((campaigns) =>
      campaigns.map((campaign) =>
        campaign.id === id
          ? { ...campaign, contractName: fileName, contractSigned: true }
          : campaign,
      ),
    );
    this.store.log('CAMPAIGN', 'activity.contractAttached', { name: this.byId(id)?.name ?? '' });
    return of({ ok: true });
  }

  /** Clôture possible uniquement si toutes les factures liées sont payées ou annulées. */
  close(id: string): Observable<ActionResult> {
    const campaign = this.byId(id);
    if (!campaign) {
      return of({ ok: false, errorKey: 'campaign.error.notFound' });
    }

    const open = campaign.invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    if (open.length) {
      return of({
        ok: false,
        errorKey: 'campaign.error.closeBlocked',
        params: { count: open.length },
      });
    }

    return this.setStatus(id, 'COMPLETED').pipe(
      tap((result) => {
        if (result.ok) {
          this.store.log('CAMPAIGN', 'activity.campaignClosed', { name: campaign.name });
        }
      }),
    );
  }

  private add(campaign: Campaign): void {
    this.store.campaigns.update((campaigns) => [campaign, ...campaigns]);
    this.store.log('CAMPAIGN', 'activity.campaignCreated', { name: campaign.name });
  }

  /** Le statut est décidé par le serveur dès que l'espace est connecté. */
  private setStatus(id: string, status: CampaignStatus): Observable<ActionResult> {
    if (!this.store.remote()) {
      this.applyStatus(id, status);
      return of({ ok: true });
    }

    return this.api.changeCampaignStatus(id, status, this.stored(id)).pipe(
      tap((campaign) =>
        this.store.campaigns.update((campaigns) =>
          campaigns.map((item) => (item.id === id ? campaign : item)),
        ),
      ),
      map(() => ({ ok: true }) as ActionResult),
      catchError((error: HttpErrorResponse) => of(apiErrorResult(error))),
    );
  }

  private applyStatus(id: string, status: CampaignStatus): void {
    this.store.campaigns.update((campaigns) =>
      campaigns.map((campaign) => (campaign.id === id ? { ...campaign, status } : campaign)),
    );
  }

  private stored(id: string): Campaign | undefined {
    return this.store.campaigns().find((campaign) => campaign.id === id);
  }
}
