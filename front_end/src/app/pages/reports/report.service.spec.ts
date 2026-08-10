import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportService);
    store = TestBed.inject(WorkspaceStore);
    TestBed.inject(I18nService).setLanguage('fr');
  });

  it('ranks brands by invoiced amount, descending', () => {
    const amounts = service.topBrands().map((row) => row.amount);

    expect(amounts.length).toBeGreaterThan(0);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
    expect(service.topBrands()[0].share).toBe(100);
  });

  it('splits revenue by deliverable type', () => {
    const labels = service.byDeliverable().map((row) => row.label);

    expect(labels).toContain('Vidéo');
    expect(labels).toContain('Story');
  });

  it('spreads unpaid invoices over four aging buckets', () => {
    const buckets = service.aging();

    expect(buckets.map((bucket) => bucket.labelKey)).toEqual([
      'aging.notDue',
      'aging.1to15',
      'aging.16to30',
      'aging.over30',
    ]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBeGreaterThan(0);
  });

  it('computes a consistent unpaid ratio', () => {
    const rate = service.unpaidRate();

    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  it('produces twelve monthly revenue points', () => {
    expect(service.monthlyRevenue().length).toBe(12);
  });

  it('reserves advanced reports for the STUDIO plan', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'STUDIO' }));
    expect(service.advancedReports()).toBe(true);

    store.creator.update((creator) => ({ ...creator, plan: 'PRO' }));
    expect(service.advancedReports()).toBe(false);

    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));
    expect(service.advancedReports()).toBe(false);
  });

  it('exports the indicators as CSV in the current language', () => {
    expect(service.toCsv()).toContain('Indicateur;Valeur');

    TestBed.inject(I18nService).setLanguage('en');
    expect(service.toCsv()).toContain('Indicator;Value');
  });
});
