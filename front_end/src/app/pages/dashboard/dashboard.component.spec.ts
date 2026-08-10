import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(DashboardComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the four mandatory indicators', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelectorAll('app-kpi-card').length).toBe(4);
    expect(text).toContain('Chiffre d’affaires');
    expect(text).toContain('En retard');
  });

  it('links every indicator to its filtered list', async () => {
    const fixture = await create();
    const targets = [...fixture.nativeElement.querySelectorAll('app-kpi-card a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );

    expect(targets).toContain('/app/factures?statut=OVERDUE');
    expect(targets).toContain('/app/paiements');
  });

  it('draws six revenue bars and lists active campaigns', async () => {
    const fixture = await create();

    expect(TestBed.inject(DashboardService).lastSixMonths().length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Campagnes actives');
    expect(fixture.nativeElement.textContent).toContain('Nike Summer');
  });

  it('offers a quick reminder on an overdue invoice', async () => {
    const fixture = await create();

    expect(TestBed.inject(DashboardService).overdueCount()).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Relancer');
  });

  it('switches the whole dashboard to English', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Revenue');
    expect(text).toContain('Active campaigns');
    expect(text).not.toContain('Campagnes actives');
  });
});
