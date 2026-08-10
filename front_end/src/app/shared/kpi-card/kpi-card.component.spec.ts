import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function create(filter: string | null = null) {
    const fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('label', 'En retard');
    fixture.componentRef.setInput('value', '800 €');
    fixture.componentRef.setInput('link', '/app/factures');
    fixture.componentRef.setInput('filter', filter);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the label and the value', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('En retard');
    expect(text).toContain('800 €');
  });

  it('links to the matching filtered list', async () => {
    const fixture = await create('OVERDUE');
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/app/factures?statut=OVERDUE');
  });
});
