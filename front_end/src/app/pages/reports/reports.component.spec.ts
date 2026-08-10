import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ReportsComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(ReportsComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the analysis indicators', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Taux d’impayés');
    expect(text).toContain('Délai moyen de paiement');
    expect(text).toContain('Propositions acceptées');
  });

  it('shows the top brands and the revenue per deliverable', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Top marques');
    expect(text).toContain('Revenus par type de livrable');
    expect(text).toContain('Nike');
  });

  it('presents the aged receivables', async () => {
    const fixture = await create();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('Plus de 30 jours');
  });

  it('translates the report', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Aged receivables');
    expect(text).toContain('Over 30 days');
  });
});
