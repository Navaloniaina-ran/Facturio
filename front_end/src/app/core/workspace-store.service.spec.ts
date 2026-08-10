import { TestBed } from '@angular/core/testing';
import { WorkspaceStore } from './workspace-store.service';

describe('WorkspaceStore', () => {
  let store: WorkspaceStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(WorkspaceStore);
  });

  it('loads the creator demo data set', () => {
    expect(store.brands().length).toBe(3);
    expect(store.campaigns().length).toBe(3);
    expect(store.invoices().length).toBe(7);
    expect(store.currency()).toBe('EUR');
  });

  it('hands out gapless sequential numbers per series', () => {
    const year = new Date().getFullYear();
    const first = store.nextNumber('INVOICE');
    const second = store.nextNumber('INVOICE');

    expect(first.startsWith(`FAC-${year}-`)).toBe(true);
    expect(Number(second.split('-')[2])).toBe(Number(first.split('-')[2]) + 1);
    expect(store.nextNumber('QUOTE').startsWith(`PRO-${year}-`)).toBe(true);
  });

  it('announces the next number without consuming it', () => {
    const peeked = store.peekNumber('INVOICE');

    expect(store.peekNumber('INVOICE')).toBe(peeked);
    expect(store.nextNumber('INVOICE')).toBe(peeked);
  });

  it('follows the prefixes set in the settings', () => {
    store.settings.update((settings) => ({ ...settings, invoicePrefix: 'INV' }));

    expect(store.peekNumber('INVOICE').startsWith('INV-')).toBe(true);
  });

  it('generates unique ids', () => {
    const ids = new Set([store.newId('i'), store.newId('i'), store.newId('i')]);

    expect(ids.size).toBe(3);
  });

  it('resolves a brand name and falls back to a dash', () => {
    expect(store.brandName('b1')).toBe('Nike');
    expect(store.brandName('unknown')).toBe('—');
  });

  it('logs activities newest first, as translation keys', () => {
    store.log('INVOICE', 'activity.invoiceSent', { number: 'FAC-1' });
    store.log('PAYMENT', 'activity.paymentReceived', { amount: '100 EUR', invoice: 'FAC-1' });

    expect(store.activities()[0].messageKey).toBe('activity.paymentReceived');
    expect(store.activities().length).toBe(2);
  });

  it('exposes the settings and the subscription of the workspace', () => {
    expect(store.settings().invoicePrefix).toBe('FAC');
    expect(store.subscription().plan).toBe('PRO');
    expect(store.platformInvoices().length).toBeGreaterThan(0);
  });

  it('tracks the onboarding tasks left', () => {
    const onboarding = store.onboarding();

    expect(onboarding.find((task) => task.key === 'brand')?.done).toBe(true);
    expect(onboarding.find((task) => task.key === 'logo')?.done).toBe(false);
  });

  it('isolates the demo data between two instances', () => {
    store.brands.update((brands) => brands.slice(1));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(WorkspaceStore).brands().length).toBe(3);
  });
});
