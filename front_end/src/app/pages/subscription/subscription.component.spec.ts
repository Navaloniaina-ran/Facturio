import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscriptionComponent } from './subscription.component';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SubscriptionComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(SubscriptionComponent);
    await fixture.whenStable();
    return fixture;
  }

  function click(fixture: { nativeElement: HTMLElement }, label: string) {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
  }

  it('shows the current plan, its usage and the three offers', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Offre en cours');
    expect(text).toContain('Consommation');
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(3);
  });

  it('prices the three offers at 0, 19 and 59 euros', async () => {
    const fixture = await create();
    const prices = TestBed.inject(SubscriptionService)
      .offers()
      .map((offer) => offer.monthlyPrice);

    expect(prices).toEqual([0, 19, 59]);
    expect((fixture.nativeElement.textContent as string).replace(/\s/gu, ' ')).toContain('19 €');
  });

  it('marks the features left out of an offer', async () => {
    const free = TestBed.inject(SubscriptionService)
      .offers()
      .find((offer) => offer.code === 'FREE')!;

    const excluded = free.features.filter((feature) => !feature.included).map((f) => f.key);
    expect(excluded).toContain('subscription.feature.campaigns');
    expect(excluded).toContain('subscription.feature.reminders');

    const studio = TestBed.inject(SubscriptionService)
      .offers()
      .find((offer) => offer.code === 'STUDIO')!;
    expect(studio.features.every((feature) => feature.included)).toBe(true);
  });

  it('measures usage against the plan quotas', async () => {
    const fixture = await create();
    const usage = TestBed.inject(SubscriptionService).usage();

    expect(usage.length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.meter').length).toBe(3);
  });

  it('switches plan and issues a subscription invoice', async () => {
    const fixture = await create();
    const service = TestBed.inject(SubscriptionService);
    const before = service.platformInvoices().length;

    const studio = [...fixture.nativeElement.querySelectorAll('article')].find((article) =>
      (article as HTMLElement).textContent?.includes('STUDIO'),
    ) as HTMLElement;
    (studio.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.current().plan).toBe('STUDIO');
    expect(service.platformInvoices().length).toBe(before + 1);
    expect(fixture.nativeElement.textContent).toContain('activée');
  });

  it('switches the billing cycle to annual', async () => {
    const fixture = await create();

    click(fixture, 'Annuel');
    await fixture.whenStable();

    expect(TestBed.inject(SubscriptionService).current().cycle).toBe('ANNUAL');
  });

  it('cancels at the end of the period, then resumes', async () => {
    const fixture = await create();
    const service = TestBed.inject(SubscriptionService);

    click(fixture, 'Annuler mon abonnement');
    await fixture.whenStable();
    expect(service.current().cancelAtPeriodEnd).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Annulation prévue');

    click(fixture, 'Reprendre mon abonnement');
    await fixture.whenStable();
    expect(service.current().cancelAtPeriodEnd).toBe(false);
  });

  it('lists the subscription invoices', async () => {
    const fixture = await create();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(
      TestBed.inject(SubscriptionService).platformInvoices().length,
    );
    expect(fixture.nativeElement.textContent).toContain('SAAS-2026-0003');
  });

  it('translates the screen', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Current plan');
    expect(fixture.nativeElement.textContent).toContain('Usage');
  });
});
