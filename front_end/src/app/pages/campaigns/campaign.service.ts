import { Injectable, computed, inject } from '@angular/core';
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

  create(draft: CampaignDraft): ActionResult {
    if (!draft.brandId || !draft.name.trim()) {
      return { ok: false, errorKey: 'campaign.error.required' };
    }
    if (!draft.deliverables.length) {
      return { ok: false, errorKey: 'campaign.error.noDeliverable' };
    }

    const campaign: Campaign = {
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
    };

    this.store.campaigns.update((campaigns) => [campaign, ...campaigns]);
    this.store.log('CAMPAIGN', 'activity.campaignCreated', { name: campaign.name });
    return { ok: true };
  }

  /** Les collaborations sont souvent récurrentes : duplication en un clic. */
  duplicate(id: string): void {
    const source = this.byId(id);
    if (!source) {
      return;
    }

    this.create({
      brandId: source.brandId,
      name: this.i18n.t('campaign.copySuffix', { name: source.name }),
      startDate: today(),
      endDate: addDays(today(), 30),
      deliverables: source.deliverables.map((d) => ({ ...d, id: this.store.newId('l') })),
    });
  }

  /** Génère la proposition de collaboration depuis les livrables de la campagne. */
  generateQuote(id: string): ActionResult {
    const campaign = this.byId(id);
    if (!campaign) {
      return { ok: false, errorKey: 'campaign.error.notFound' };
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

    if (result.ok) {
      this.setStatus(id, 'PENDING');
      return { ok: true };
    }
    return { ok: false, errorKey: result.errorKey, params: result.params };
  }

  /** La facture se génère depuis la campagne, sans ressaisie (P04). */
  generateInvoice(id: string): ActionResult<InvoiceView> {
    const campaign = this.byId(id);
    if (!campaign) {
      return { ok: false, errorKey: 'campaign.error.notFound' };
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
      return result;
    }

    this.setStatus(id, 'ACTIVE');
    return result;
  }

  attachContract(id: string, fileName: string): void {
    this.store.campaigns.update((campaigns) =>
      campaigns.map((campaign) =>
        campaign.id === id
          ? { ...campaign, contractName: fileName, contractSigned: true }
          : campaign,
      ),
    );
    this.store.log('CAMPAIGN', 'activity.contractAttached', { name: this.byId(id)?.name ?? '' });
  }

  /** Clôture possible uniquement si toutes les factures liées sont payées ou annulées. */
  close(id: string): ActionResult {
    const campaign = this.byId(id);
    if (!campaign) {
      return { ok: false, errorKey: 'campaign.error.notFound' };
    }

    const open = campaign.invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    if (open.length) {
      return {
        ok: false,
        errorKey: 'campaign.error.closeBlocked',
        params: { count: open.length },
      };
    }

    this.setStatus(id, 'COMPLETED');
    this.store.log('CAMPAIGN', 'activity.campaignClosed', { name: campaign.name });
    return { ok: true };
  }

  private setStatus(id: string, status: CampaignStatus): void {
    this.store.campaigns.update((campaigns) =>
      campaigns.map((campaign) => (campaign.id === id ? { ...campaign, status } : campaign)),
    );
  }
}
