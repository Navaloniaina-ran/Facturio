import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create(status: string, extra: string | null = null) {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('extra', extra);
    await fixture.whenStable();
    return fixture;
  }

  it('translates the status code', async () => {
    const fixture = await create('PARTIALLY_PAID');
    expect(fixture.nativeElement.textContent).toContain('Partiellement payée');
  });

  it('switches language on demand', async () => {
    const fixture = await create('PARTIALLY_PAID');

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Partially paid');
  });

  it('shows the extra detail', async () => {
    const fixture = await create('OVERDUE', '12 j');
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('En retard');
    expect(text).toContain('12 j');
  });

  it('paints an overdue status in red', async () => {
    const fixture = await create('OVERDUE');
    expect(fixture.nativeElement.querySelector('span').className).toContain('text-rose-700');
  });
});
