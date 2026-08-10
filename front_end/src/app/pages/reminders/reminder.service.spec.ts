import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService } from '../invoices/invoice.service';
import { ReminderService } from './reminder.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let invoices: InvoiceService;
  let store: WorkspaceStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReminderService);
    invoices = TestBed.inject(InvoiceService);
    store = TestBed.inject(WorkspaceStore);
    TestBed.inject(I18nService).setLanguage('fr');
    invoices.recomputeStatuses();
  });

  it('queues the overdue invoice with its most advanced step', () => {
    const item = service.queue().find((i) => i.invoice.number === 'FAC-2026-0002')!;

    expect(item).toBeDefined();
    // Échéance dépassée de 12 jours : l'étape J+7 est la dernière échue.
    expect(item.step.offsetDays).toBe(7);
  });

  it('exposes a single reminder per invoice', () => {
    const ids = service.queue().map((item) => item.invoice.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('excludes settled and cancelled invoices and drafts', () => {
    const numbers = service.queue().map((item) => item.invoice.number);

    expect(numbers).not.toContain('FAC-2026-0003');
    expect(numbers).not.toContain('FAC-2026-0005');
  });

  it('honours the reminder pause of a brand', () => {
    const before = service.queue().length;
    service.togglePause('b2');

    expect(service.queue().length).toBeLessThan(before);
  });

  it('composes a message with the amount due and the delay', () => {
    const item = service.queue().find((i) => i.invoice.number === 'FAC-2026-0002')!;

    const message = service.suggestedMessage(item);

    expect(message).toContain('FAC-2026-0002');
    expect(message).toContain('800');
    expect(message).toContain('retard');
  });

  it('translates the message into English', () => {
    TestBed.inject(I18nService).setLanguage('en');
    const item = service.queue().find((i) => i.invoice.number === 'FAC-2026-0002')!;

    const message = service.suggestedMessage(item);

    expect(message).toContain('Hello');
    expect(message).toContain('overdue');
  });

  it('records the reminder in the history', () => {
    const item = service.queue()[0];

    expect(service.send(item).ok).toBe(true);

    const history = service.historyFor(item.invoice.id);
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('SENT');
    expect(service.sentThisMonth()).toBe(1);
  });

  it('never sends the same step twice', () => {
    const item = service.queue().find((i) => i.invoice.number === 'FAC-2026-0002')!;
    service.send(item);

    const next = service.queue().find((i) => i.invoice.number === 'FAC-2026-0002');
    expect(next?.step.id).not.toBe(item.step.id);
  });

  it('postpones a reminder to a later date', () => {
    const item = service.queue()[0];

    service.postpone(item, 3);

    expect(store.reminders()[0].status).toBe('SCHEDULED');
    expect(store.reminders()[0].scheduledDate > item.scheduledDate).toBe(true);
  });

  it('caps the number of active steps according to the plan', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'PRO' }));
    store.reminderSteps.update((steps) => steps.map((step) => ({ ...step, active: false })));

    expect(service.toggleStep('r1').ok).toBe(true);
    expect(service.toggleStep('r2').ok).toBe(true);
    expect(service.toggleStep('r3').ok).toBe(true);

    const fourth = service.toggleStep('r4');
    expect(fourth.ok).toBe(false);
    expect(fourth.errorKey).toBe('quota.limit');
  });

  it('offers no automatic reminder on the free plan', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));
    store.reminderSteps.update((steps) => steps.map((step) => ({ ...step, active: false })));

    expect(service.toggleStep('r1').errorKey).toBe('quota.limit');
  });

  it('always allows switching a step off', () => {
    store.creator.update((creator) => ({ ...creator, plan: 'FREE' }));

    expect(service.toggleStep('r1').ok).toBe(true);
    expect(service.steps().find((step) => step.id === 'r1')?.active).toBe(false);
  });
});
