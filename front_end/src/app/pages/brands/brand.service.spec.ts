import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { BrandService, EMPTY_BRAND } from './brand.service';

describe('BrandService', () => {
  let service: BrandService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrandService);
    store = TestBed.inject(WorkspaceStore);
    TestBed.inject(I18nService).setLanguage('fr');
  });

  it('aggregates invoiced, paid and outstanding per brand', () => {
    const nike = service.list().find((b) => b.name === 'Nike')!;

    expect(nike.invoiceCount).toBe(3);
    expect(nike.totalInvoiced).toBeGreaterThan(0);
    expect(nike.totalInvoiced).toBe(nike.totalPaid + nike.outstanding);
  });

  it('scores brand reliability and ranks the most reliable first', () => {
    const ranked = service.mostReliable();

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].reliability).toBeGreaterThanOrEqual(ranked.at(-1)!.reliability);

    const kama = service.list().find((b) => b.name === 'Studio Kama')!;
    const glow = service.list().find((b) => b.name === 'Glow Cosmetics')!;
    expect(kama.reliability).toBeGreaterThan(glow.reliability);
    expect(kama.settledCount).toBeGreaterThan(0);
    expect(kama.reliabilityKey.startsWith('reliability.')).toBe(true);
  });

  it('flags brands with an overdue invoice', () => {
    expect(service.latePayerCount()).toBeGreaterThan(0);
    expect(service.list().find((b) => b.name === 'Glow Cosmetics')?.latePayer).toBe(true);
  });

  it('refuses a brand without a name', () => {
    expect(service.create({ ...EMPTY_BRAND }).errorKey).toBe('brand.error.name');
  });

  it('refuses a malformed email', () => {
    expect(service.create({ ...EMPTY_BRAND, name: 'Adidas', email: 'contact' }).ok).toBe(false);
  });

  it('adds a valid brand', () => {
    const before = store.brands().length;

    expect(service.create({ ...EMPTY_BRAND, name: 'Adidas', email: 'contact@adidas.example' }).ok).toBe(true);
    expect(store.brands().length).toBe(before + 1);
  });

  it('blocks creation beyond the plan quota', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));

    const result = service.create({ ...EMPTY_BRAND, name: 'Adidas' });

    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('quota.limit');
    expect(TestBed.inject(I18nService).error(result)).toContain('Limite atteinte');
  });

  it('protects a brand that carries invoices', () => {
    const nike = service.list().find((b) => b.name === 'Nike')!;

    expect(service.remove(nike.id).errorKey).toBe('brand.error.hasInvoices');
  });

  it('exports the portfolio as CSV', () => {
    const csv = service.toCsv();

    expect(csv.split('\n')[0]).toContain('Nom');
    expect(csv).toContain('Nike');
  });
});
