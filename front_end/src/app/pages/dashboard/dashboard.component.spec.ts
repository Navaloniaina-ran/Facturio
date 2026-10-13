import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth.service';
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

    expect(targets).toContain('/createur/factures?statut=OVERDUE');
    expect(targets).toContain('/createur/paiements');
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

  // Le tableau de bord est commun, mais deux de ses volets renvoient vers des
  // écrans que la garde de route refuse à une PME.
  it('hides the creator-only panels from a BUSINESS workspace', async () => {
    TestBed.inject(AuthService).signIn('pme@facturio.example', 'demonstration', 'BUSINESS');

    const fixture = await create();
    const links = [...fixture.nativeElement.querySelectorAll('a')].map((item) =>
      (item as HTMLAnchorElement).getAttribute('href'),
    );

    expect(links).not.toContain('/entreprise/campagnes');
    expect(links).not.toContain('/entreprise/collaborations');
    // Les volets communs restent en place.
    expect(links).toContain('/entreprise/factures');
  });

  it('keeps them for a CREATOR workspace', async () => {
    TestBed.inject(AuthService).signIn('createur@facturio.example', 'demonstration', 'CREATOR');

    const fixture = await create();
    const links = [...fixture.nativeElement.querySelectorAll('a')].map((item) =>
      (item as HTMLAnchorElement).getAttribute('href'),
    );

    expect(links).toContain('/createur/campagnes');
    expect(links).toContain('/createur/collaborations');
  });
});
