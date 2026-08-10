import { TestBed } from '@angular/core/testing';
import { addDays, today } from '../../core/calculations';
import { Line } from '../../core/models';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { QuoteService } from '../quotes/quote.service';
import { CampaignService } from './campaign.service';

function deliverable(id: string): Line {
  return {
    id,
    description: 'Reel Instagram',
    deliverableType: 'REEL',
    quantity: 2,
    unitPrice: 300,
    discountType: 'PERCENT',
    discountValue: 0,
    vatRate: 20,
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignService);
    store = TestBed.inject(WorkspaceStore);
  });

  it('aggregates the deliverables and totals of a campaign', () => {
    const nike = service.list().find((c) => c.name === 'Nike Summer')!;

    expect(nike.totalExclVat).toBe(1500);
    expect(nike.deliverableCount).toBe(6);
    expect(nike.totalInclVat).toBe(1800);
  });

  it('exposes the quote → contract → invoice → payment chain', () => {
    const nike = service.list().find((c) => c.name === 'Nike Summer')!;

    expect(nike.chain.map((step) => step.labelKey)).toEqual([
      'chain.quote',
      'chain.contract',
      'chain.invoice',
      'chain.payment',
    ]);
    expect(nike.progress).toBe(100);
  });

  it('generates an invoice from the campaign with no re-entry', () => {
    const glow = service.list().find((c) => c.name === 'Glow — routine automne')!;

    const result = service.generateInvoice(glow.id);

    expect(result.ok).toBe(true);
    expect(result.value?.campaignId).toBe(glow.id);
    expect(result.value?.totalInclVat).toBe(glow.totalInclVat);
    expect(service.byId(glow.id)?.status).toBe('ACTIVE');
  });

  it('generates the quote from the deliverables', () => {
    const quotes = TestBed.inject(QuoteService);
    const campaign = service.list().find((c) => c.name === 'Glow — routine automne')!;
    const before = quotes.list().length;

    expect(service.generateQuote(campaign.id).ok).toBe(true);
    expect(quotes.list().length).toBe(before + 1);
    expect(service.byId(campaign.id)?.status).toBe('PENDING');
  });

  it('refuses to close when a linked invoice is neither paid nor cancelled', () => {
    const nike = service.list().find((c) => c.name === 'Nike Summer')!;

    const result = service.close(nike.id);

    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('campaign.error.closeBlocked');
  });

  it('closes a campaign whose invoices are all paid', () => {
    const kama = service.list().find((c) => c.name === 'Lancement Studio Kama')!;

    expect(service.close(kama.id).ok).toBe(true);
    expect(service.byId(kama.id)?.status).toBe('COMPLETED');
  });

  it('duplicates a recurring campaign as a draft', () => {
    const source = service.list()[0];
    const before = store.campaigns().length;

    service.duplicate(source.id);

    expect(store.campaigns().length).toBe(before + 1);
    expect(service.list().some((c) => c.name === `${source.name} (copie)`)).toBe(true);
  });

  it('creates a campaign with its deliverables', () => {
    const result = service.create({
      brandId: 'b1',
      name: 'Rentrée 2026',
      startDate: today(),
      endDate: addDays(today(), 20),
      deliverables: [deliverable('l1')],
    });

    expect(result.ok).toBe(true);
    expect(service.list().find((c) => c.name === 'Rentrée 2026')?.totalExclVat).toBe(600);
  });

  it('refuses a campaign without a deliverable', () => {
    expect(
      service.create({
        brandId: 'b1',
        name: 'Empty',
        startDate: today(),
        endDate: today(),
        deliverables: [],
      }).errorKey,
    ).toBe('campaign.error.noDeliverable');
  });

  it('reserves the Campaigns module for paid plans', () => {
    expect(service.moduleAllowed()).toBe(true);

    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));
    expect(service.moduleAllowed()).toBe(false);
  });
});
