import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { PaymentService } from './payment.service';
import { PaymentsComponent } from './payments.component';

describe('PaymentsComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [PaymentsComponent] }).compileComponents();
    TestBed.inject(I18nService).setLanguage('fr');
  });

  async function create() {
    const fixture = TestBed.createComponent(PaymentsComponent);
    await fixture.whenStable();
    return fixture;
  }

  function click(fixture: { nativeElement: HTMLElement }, label: string) {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    ) as HTMLButtonElement;
    button.click();
  }

  it('shows the collection summary', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Total encaissé');
    expect(text).toContain('Encaissé ce mois');
    expect(text).toContain('En retard');
  });

  it('lists the recorded payments', async () => {
    const fixture = await create();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(
      TestBed.inject(PaymentService).list().length,
    );
    expect(fixture.nativeElement.textContent).toContain('Mobile money');
  });

  it('opens the form prefilled with the outstanding amount', async () => {
    const fixture = await create();

    click(fixture, 'Enregistrer un paiement');
    await fixture.whenStable();

    const amount = fixture.nativeElement.querySelector('#amount') as HTMLInputElement;
    expect(Number(amount.value)).toBeGreaterThan(0);
  });

  it('removes a payment and recomputes the status', async () => {
    const fixture = await create();
    const service = TestBed.inject(PaymentService);
    const before = service.list().length;

    (
      fixture.nativeElement.querySelector('tbody [title="Supprimer"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(service.list().length).toBe(before - 1);
    expect(fixture.nativeElement.textContent).toContain('Paiement supprimé');
  });

  it('translates the columns', async () => {
    const fixture = await create();

    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Total collected');
    expect(text).toContain('Bank transfer');
  });
});
