import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { QuoteService } from './quote.service';
import { QuotesComponent } from './quotes.component';

describe('QuotesComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [QuotesComponent],
      providers: [provideRouter([{ path: 'app/factures', children: [] }])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(QuotesComponent);
    await fixture.whenStable();
    return fixture;
  }

  function click(fixture: { nativeElement: HTMLElement }, label: string) {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
  }

  it('lists the quotes with the creator vocabulary', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Propositions de collaboration');
    expect(text).toContain('PRO-2026-0002');
  });

  it('offers the conversion on an accepted quote', async () => {
    const fixture = await create();
    expect(
      fixture.nativeElement.querySelector('[title="Transformer en facture"]'),
    ).toBeTruthy();
  });

  it('converts the accepted quote into an invoice', async () => {
    const fixture = await create();
    const service = TestBed.inject(QuoteService);
    const accepted = service.list().find((quote) => quote.status === 'ACCEPTED')!;

    (
      fixture.nativeElement.querySelector('[title="Transformer en facture"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(service.byId(accepted.id)?.status).toBe('INVOICED');
    expect(fixture.nativeElement.textContent).toContain('créée à l’identique');
  });

  it('filters the list by status', async () => {
    const fixture = await create();

    click(fixture, 'Refusée');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Aucune proposition pour ce filtre.');
  });

  it('translates the page title', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Collaboration quotes');
  });
});
