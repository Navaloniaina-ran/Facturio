import { Injectable, computed, inject } from '@angular/core';
import { BillingApiService } from '../../core/api/billing-api.service';
import { addDays, daysBetween, today } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { ActionResult, Reminder, ReminderStep } from '../../core/models';
import { checkLimit } from '../../core/quotas';
import { ReminderMode, WorkspaceStore } from '../../core/workspace-store.service';
import { InvoiceService, InvoiceView } from '../invoices/invoice.service';

export interface QueueItem {
  invoice: InvoiceView;
  step: ReminderStep;
  scheduledDate: string;
}

export interface ReminderView extends Reminder {
  invoiceNumber: string;
  brandName: string;
  stepLabelKey: string;
}

/** Plafond d'envois quotidien, pour préserver la réputation d'expédition. */
export const DAILY_SEND_CAP = 30;

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly store = inject(WorkspaceStore);
  private readonly invoices = inject(InvoiceService);
  private readonly i18n = inject(I18nService);
  private readonly api = inject(BillingApiService);

  readonly steps = this.store.reminderSteps.asReadonly();
  readonly mode = this.store.reminderMode.asReadonly();

  readonly history = computed<ReminderView[]>(() =>
    this.store
      .reminders()
      .map((reminder) => {
        const invoice = this.invoices.byId(reminder.invoiceId);
        return {
          ...reminder,
          invoiceNumber: invoice?.number ?? '—',
          brandName: invoice?.brandName ?? '—',
          stepLabelKey: this.steps().find((s) => s.id === reminder.stepId)?.labelKey ?? '',
        };
      })
      .sort((a, b) => (b.sentDate ?? b.scheduledDate).localeCompare(a.sentDate ?? a.scheduledDate)),
  );

  /** Étapes échues et non encore envoyées : ce qu'il faut traiter aujourd'hui. */
  readonly queue = computed<QueueItem[]>(() =>
    this.pendingSteps().filter((item) => item.scheduledDate <= today()),
  );

  /** Étapes programmées dans les trois jours. */
  readonly upcoming = computed<QueueItem[]>(() =>
    this.pendingSteps().filter((item) => {
      const days = daysBetween(today(), item.scheduledDate);
      return days > 0 && days <= 3;
    }),
  );

  readonly dueToday = computed(
    () => this.queue().filter((item) => item.scheduledDate === today()).length,
  );

  readonly pastDue = computed(
    () => this.queue().filter((item) => item.invoice.daysOverdue > 0).length,
  );

  readonly sentThisMonth = computed(() => {
    const month = today().slice(0, 7);
    return this.store
      .reminders()
      .filter((r) => r.status === 'SENT' && (r.sentDate ?? '').startsWith(month)).length;
  });

  readonly sentToday = computed(
    () =>
      this.store.reminders().filter((r) => r.status === 'SENT' && r.sentDate === today()).length,
  );

  historyFor(invoiceId: string): ReminderView[] {
    return this.history().filter((reminder) => reminder.invoiceId === invoiceId);
  }

  setMode(mode: ReminderMode): void {
    this.store.reminderMode.set(mode);
  }

  /** Active ou désactive une étape, dans la limite autorisée par l'offre. */
  toggleStep(id: string): ActionResult {
    const step = this.steps().find((s) => s.id === id);
    if (!step) {
      return { ok: false, errorKey: 'payment.error.notFound' };
    }

    if (!step.active) {
      const active = this.steps().filter((s) => s.active).length;
      const block = checkLimit(this.store.creator().plan, 'reminderSteps', active);
      if (block) {
        return { ok: false, errorKey: block.errorKey, params: block.params };
      }
    }

    if (this.store.remote()) {
      this.api.toggleReminderRule(id, !step.active).subscribe((updated) => {
        this.store.reminderSteps.update((steps) =>
          steps.map((item) => (item.id === id ? updated : item)),
        );
      });
      return { ok: true };
    }

    this.store.reminderSteps.update((steps) =>
      steps.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
    return { ok: true };
  }

  /** Message pré-rempli à partir du modèle de l'étape et des variables de la facture. */
  suggestedMessage(item: QueueItem): string {
    const brand = this.store.brand(item.invoice.brandId);
    const contact = brand?.contact || item.invoice.brandName;
    const late = item.invoice.daysOverdue;
    const amount = `${item.invoice.outstanding} ${this.store.currency()}`;
    const creator = this.store.creator();

    const body =
      late <= 0
        ? this.i18n.t('mail.beforeDue', {
            number: item.invoice.number,
            amount,
            date: item.invoice.dueDate,
          })
        : this.i18n.t('mail.overdue', { number: item.invoice.number, amount, days: late });

    return [
      this.i18n.t('mail.greeting', { contact }),
      '',
      body,
      '',
      this.i18n.t('mail.template', { template: this.i18n.t(item.step.templateKey) }),
      `${creator.name} — ${creator.handle}`,
    ].join('\n');
  }

  send(item: QueueItem, content = ''): ActionResult {
    if (this.sentToday() >= DAILY_SEND_CAP) {
      return { ok: false, errorKey: 'reminder.error.cap', params: { cap: DAILY_SEND_CAP } };
    }

    if (this.store.remote()) {
      const scheduled = this.store
        .reminders()
        .find(
          (reminder) =>
            reminder.invoiceId === item.invoice.id &&
            reminder.stepId === item.step.id &&
            reminder.status === 'SCHEDULED',
        );
      if (!scheduled) {
        this.api
          .createReminder(
            item.invoice.id,
            item.step.id,
            item.scheduledDate,
            content || this.suggestedMessage(item),
            true,
          )
          .subscribe({
            next: (reminder) => this.store.reminders.update((items) => [reminder, ...items]),
            error: () => undefined,
          });
        return { ok: true };
      }
      this.api.reminderAction(scheduled.id, 'send').subscribe((reminder) => {
        this.store.reminders.update((items) =>
          items.map((item) => (item.id === reminder.id ? reminder : item)),
        );
      });
      return { ok: true };
    }

    const reminder: Reminder = {
      id: this.store.newId('r'),
      invoiceId: item.invoice.id,
      stepId: item.step.id,
      scheduledDate: item.scheduledDate,
      sentDate: today(),
      status: 'SENT',
      content: content || this.suggestedMessage(item),
    };

    this.store.reminders.update((reminders) => [reminder, ...reminders]);
    this.store.log('REMINDER', 'activity.reminderSent', {
      template: this.i18n.t(item.step.templateKey),
      brand: item.invoice.brandName,
      invoice: item.invoice.number,
    });
    return { ok: true };
  }

  /** Reporte l'étape en enregistrant une relance programmée à une date ultérieure. */
  postpone(item: QueueItem, days = 3): void {
    if (this.store.remote()) {
      const scheduledDate = addDays(today(), days);
      this.api
        .createReminder(
          item.invoice.id,
          item.step.id,
          scheduledDate,
          this.suggestedMessage(item),
          false,
        )
        .subscribe({
          next: (reminder) => this.store.reminders.update((items) => [reminder, ...items]),
          error: () => undefined,
        });
      return;
    }

    const reminder: Reminder = {
      id: this.store.newId('r'),
      invoiceId: item.invoice.id,
      stepId: item.step.id,
      scheduledDate: addDays(today(), days),
      sentDate: null,
      status: 'SCHEDULED',
      content: '',
    };

    this.store.reminders.update((reminders) => [reminder, ...reminders]);
  }

  /** Garde-fou : plus aucune relance dès que la facture est intégralement payée. */
  cancelFor(invoiceId: string): void {
    if (this.store.remote()) {
      for (const reminder of this.store
        .reminders()
        .filter((item) => item.invoiceId === invoiceId && item.status === 'SCHEDULED')) {
        this.api.reminderAction(reminder.id, 'cancel').subscribe((updated) => {
          this.store.reminders.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        });
      }
      return;
    }
    this.store.reminders.update((reminders) =>
      reminders.map((reminder) =>
        reminder.invoiceId === invoiceId && reminder.status === 'SCHEDULED'
          ? { ...reminder, status: 'CANCELLED' }
          : reminder,
      ),
    );
    this.store.log('REMINDER', 'activity.remindersCancelled');
  }

  /** Suspend ou réactive les relances pour une marque donnée. */
  togglePause(brandId: string): void {
    this.store.brands.update((brands) =>
      brands.map((brand) =>
        brand.id === brandId ? { ...brand, remindersPaused: !brand.remindersPaused } : brand,
      ),
    );
  }

  private pendingSteps(): QueueItem[] {
    const reminders = this.store.reminders();
    const activeSteps = this.steps().filter((step) => step.active);
    const items: QueueItem[] = [];

    for (const invoice of this.invoices.list()) {
      const eligible =
        invoice.outstanding > 0 &&
        invoice.status !== 'DRAFT' &&
        invoice.status !== 'CANCELLED' &&
        !this.store.brand(invoice.brandId)?.remindersPaused;

      if (!eligible) {
        continue;
      }

      const candidates: QueueItem[] = [];
      for (const step of activeSteps) {
        const alreadyHandled = reminders.some(
          (r) =>
            r.invoiceId === invoice.id &&
            r.stepId === step.id &&
            (r.status === 'SENT' || r.status === 'CANCELLED'),
        );
        if (alreadyHandled) {
          continue;
        }

        const postponed = reminders.find(
          (r) => r.invoiceId === invoice.id && r.stepId === step.id && r.status === 'SCHEDULED',
        );

        candidates.push({
          invoice,
          step,
          scheduledDate: postponed?.scheduledDate ?? addDays(invoice.dueDate, step.offsetDays),
        });
      }

      // Une seule relance par facture à la fois : l'étape la plus avancée dont la date est atteinte.
      const due = candidates
        .filter((item) => item.scheduledDate <= today())
        .sort((a, b) => b.step.offsetDays - a.step.offsetDays);

      if (due.length) {
        items.push(due[0]);
        continue;
      }

      const next = candidates
        .filter((item) => item.scheduledDate > today())
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

      if (next) {
        items.push(next);
      }
    }

    return items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }
}
