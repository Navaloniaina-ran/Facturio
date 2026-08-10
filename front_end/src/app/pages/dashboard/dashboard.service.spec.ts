import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let board: DashboardService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    board = TestBed.inject(DashboardService);
  });

  it('separates revenue, collected and still owed', () => {
    expect(board.revenue()).toBeGreaterThan(0);
    expect(board.collected()).toBeGreaterThan(0);
    expect(board.revenue()).toBeGreaterThanOrEqual(board.collected());
  });

  it('surfaces overdue invoices', () => {
    expect(board.overdueCount()).toBeGreaterThan(0);
    expect(board.overdueAmount()).toBeGreaterThan(0);
  });

  it('keeps only invoices that are still owed in the upcoming list', () => {
    for (const invoice of board.upcoming()) {
      expect(invoice.outstanding).toBeGreaterThan(0);
    }
  });

  it('produces six normalised revenue points', () => {
    const points = board.lastSixMonths();

    expect(points.length).toBe(6);
    for (const point of points) {
      expect(point.share).toBeGreaterThanOrEqual(4);
      expect(point.share).toBeLessThanOrEqual(100);
    }
  });

  it('lists the onboarding tasks still to do', () => {
    expect(board.remainingOnboarding().length).toBeGreaterThan(0);
  });
});
