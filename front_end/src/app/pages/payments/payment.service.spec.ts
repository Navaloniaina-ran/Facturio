import { TestBed } from '@angular/core/testing';
import { today } from '../../core/calculations';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';
import { ReminderService } from '../reminders/reminder.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let invoices: InvoiceService;
  let reminders: ReminderService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentService);
    invoices = TestBed.inject(InvoiceService);
    reminders = TestBed.inject(ReminderService);
    store = TestBed.inject(WorkspaceStore);
    invoices.recomputeStatuses();
  });

  function invoice(number: string) {
    return invoices.list().find((i) => i.number === number)!;
  }

  it('links every payment to its invoice and brand', () => {
    const payment = service.list().find((p) => p.invoiceNumber === 'FAC-2026-0001')!;

    expect(payment.brandName).toBe('Nike');
    expect(payment.amount).toBe(900);
  });

  it('refuses an amount above the outstanding balance', () => {
    const target = invoice('FAC-2026-0001');

    const result = service.record({
      invoiceId: target.id,
      amount: target.outstanding + 1,
      date: today(),
      method: 'TRANSFER',
      reference: '',
      note: '',
    });

    expect(result.errorKey).toBe('payment.error.exceeds');
  });

  it('refuses a zero or negative amount', () => {
    expect(
      service.record({
        invoiceId: invoice('FAC-2026-0001').id,
        amount: 0,
        date: today(),
        method: 'TRANSFER',
        reference: '',
        note: '',
      }).errorKey,
    ).toBe('payment.error.amount');
  });

  // Critère de recette A07 : deux versements partiels puis solde.
  it('recomputes the outstanding balance on every payment until settled', () => {
    const target = invoice('FAC-2026-0002');

    service.record({
      invoiceId: target.id,
      amount: 400,
      date: today(),
      method: 'MOBILE_MONEY',
      reference: 'MV-1',
      note: '',
    });

    expect(invoices.byId(target.id)?.outstanding).toBe(400);
    expect(invoices.byId(target.id)?.status).toBe('OVERDUE');

    service.record({
      invoiceId: target.id,
      amount: 400,
      date: today(),
      method: 'MOBILE_MONEY',
      reference: 'MV-2',
      note: '',
    });

    expect(invoices.byId(target.id)?.outstanding).toBe(0);
    expect(invoices.byId(target.id)?.status).toBe('PAID');
  });

  // Critère de recette A09 : garde-fou des relances.
  it('cancels scheduled reminders as soon as the invoice is settled', () => {
    const target = invoice('FAC-2026-0002');
    const item = reminders.queue().find((i) => i.invoice.id === target.id)!;
    reminders.postpone(item, 5);

    expect(store.reminders().some((r) => r.status === 'SCHEDULED')).toBe(true);

    service.record({
      invoiceId: target.id,
      amount: target.outstanding,
      date: today(),
      method: 'TRANSFER',
      reference: '',
      note: '',
    });

    expect(store.reminders().some((r) => r.status === 'SCHEDULED')).toBe(false);
  });

  it('recomputes the invoice status after a payment is removed', () => {
    const target = invoice('FAC-2026-0003');
    const payment = service.forInvoice(target.id)[0];

    expect(target.status).toBe('PAID');

    service.remove(payment.id);

    expect(invoices.byId(target.id)?.status).not.toBe('PAID');
    expect(invoices.byId(target.id)?.outstanding).toBe(1200);
  });

  it('adds up the collections of the current month', () => {
    const before = service.collectedThisMonth();

    service.record({
      invoiceId: invoice('FAC-2026-0004').id,
      amount: 100,
      date: today(),
      method: 'CARD',
      reference: '',
      note: '',
    });

    expect(service.collectedThisMonth()).toBe(before + 100);
  });
});
