import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/i18n/i18n.service';
import { ReminderMode } from '../../core/workspace-store.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { DAILY_SEND_CAP, QueueItem, ReminderService } from './reminder.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

/**
 * Moteur de relances (P03) : c'est ce module qui distingue le produit
 * d'un simple générateur de factures.
 */
@Component({
  selector: 'app-reminders',
  imports: [
    PageHeaderComponent,
    FormsModule,
    AmountPipe,
    LocalDatePipe,
    ModalComponent,
    StatusBadgeComponent,
    IconButtonComponent,
  ],
  templateUrl: './reminders.component.html',
})
export class RemindersComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ReminderService);

  protected readonly cap = DAILY_SEND_CAP;
  protected readonly message = signal<string | null>(null);
  protected readonly current = signal<QueueItem | null>(null);
  protected content = '';

  protected changeMode(mode: ReminderMode): void {
    this.service.setMode(mode);
    this.message.set(
      this.i18n.t(mode === 'AUTO' ? 'reminders.flash.auto' : 'reminders.flash.manual'),
    );
  }

  protected toggleStep(id: string): void {
    const result = this.service.toggleStep(id);
    this.message.set(result.ok ? null : this.i18n.error(result));
  }

  /** Ouvre le message proposé à partir du modèle de l'étape. */
  protected prepare(item: QueueItem): void {
    this.current.set(item);
    this.content = this.service.suggestedMessage(item);
  }

  protected send(item: QueueItem): void {
    const result = this.service.send(item);
    this.message.set(
      result.ok
        ? this.i18n.t('reminders.flash.sent', {
            brand: item.invoice.brandName,
            number: item.invoice.number,
          })
        : this.i18n.error(result),
    );
  }

  protected sendFromModal(): void {
    const item = this.current();
    if (!item) {
      return;
    }

    const result = this.service.send(item, this.content);
    this.message.set(
      result.ok ? this.i18n.t('reminders.flash.sentShort') : this.i18n.error(result),
    );
    this.current.set(null);
  }

  protected postpone(item: QueueItem): void {
    this.service.postpone(item, 3);
    this.message.set(this.i18n.t('reminders.flash.postponed'));
  }

  protected close(): void {
    this.current.set(null);
  }
}
