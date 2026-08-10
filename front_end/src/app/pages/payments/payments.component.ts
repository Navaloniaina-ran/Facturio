import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { today } from '../../core/calculations';
import { I18nService } from '../../core/i18n/i18n.service';
import { PaymentMethod } from '../../core/models';
import { AmountPipe } from '../../shared/amount.pipe';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { IconButtonComponent } from '../../shared/icon-button/icon-button.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaymentService } from './payment.service';

const METHODS: PaymentMethod[] = ['TRANSFER', 'MOBILE_MONEY', 'CARD', 'CASH', 'PAYPAL'];

/** Encaissements : une facture peut recevoir N paiements (P07). */
@Component({
  selector: 'app-payments',
  imports: [FormsModule, AmountPipe, LocalDatePipe, ModalComponent, IconButtonComponent],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(PaymentService);

  protected readonly methods = METHODS;
  protected readonly modal = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected draft = {
    invoiceId: '',
    amount: 0,
    date: today(),
    method: 'TRANSFER' as PaymentMethod,
    reference: '',
    note: '',
  };

  /** Méthode et non signal calculé : la sélection vit dans le formulaire. */
  protected selectedOutstanding(): number {
    return this.service.dueInvoices().find((i) => i.id === this.draft.invoiceId)?.outstanding ?? 0;
  }

  protected open(): void {
    const first = this.service.dueInvoices()[0];
    this.draft = {
      invoiceId: first?.id ?? '',
      amount: first?.outstanding ?? 0,
      date: today(),
      method: 'TRANSFER',
      reference: '',
      note: '',
    };
    this.error.set(null);
    this.modal.set(true);
  }

  protected refreshAmount(): void {
    this.draft.amount = this.selectedOutstanding();
  }

  protected save(): void {
    const result = this.service.record({
      invoiceId: this.draft.invoiceId,
      amount: Number(this.draft.amount),
      date: this.draft.date,
      method: this.draft.method,
      reference: this.draft.reference,
      note: this.draft.note,
    });

    if (!result.ok) {
      this.error.set(this.i18n.error(result));
      return;
    }

    this.message.set(
      this.i18n.t(result.value?.settled ? 'invoices.flash.settled' : 'invoices.flash.partial'),
    );
    this.modal.set(false);
  }

  protected remove(id: string): void {
    this.service.remove(id);
    this.message.set(this.i18n.t('payments.flash.deleted'));
  }

  protected close(): void {
    this.modal.set(false);
    this.error.set(null);
  }
}
