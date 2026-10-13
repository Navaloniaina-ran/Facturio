import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Invoice, Payment, Quote, Reminder, ReminderStep } from '../models';
import type { InvoiceDraft } from '../../pages/invoices/invoice.service';
import type { QuoteDraft } from '../../pages/quotes/quote.service';
import {
  BillingDocumentDto,
  BillingDocumentRequestDto,
  PaymentDto,
  ReminderDto,
  ReminderRuleDto,
} from './api.dto';
import { toInvoice, toPayment, toQuote, toReminder, toReminderRule } from './billing.mappers';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly http = inject(HttpClient);

  invoices(): Observable<Invoice[]> {
    return this.http
      .get<BillingDocumentDto[]>('/api/invoices')
      .pipe(map((items) => items.map(toInvoice)));
  }

  quotes(): Observable<Quote[]> {
    return this.http
      .get<BillingDocumentDto[]>('/api/quotes')
      .pipe(map((items) => items.map(toQuote)));
  }

  createInvoice(draft: InvoiceDraft): Observable<Invoice> {
    return this.http
      .post<BillingDocumentDto>('/api/invoices', this.invoiceRequest(draft))
      .pipe(map(toInvoice));
  }

  updateInvoice(id: string, draft: InvoiceDraft): Observable<Invoice> {
    return this.http
      .put<BillingDocumentDto>(`/api/invoices/${id}`, this.invoiceRequest(draft))
      .pipe(map(toInvoice));
  }

  invoiceAction(id: string, action: 'send' | 'cancel'): Observable<Invoice> {
    return this.http
      .post<BillingDocumentDto>(`/api/invoices/${id}/${action}`, {})
      .pipe(map(toInvoice));
  }

  creditNote(id: string): Observable<Invoice> {
    return this.http
      .post<BillingDocumentDto>(`/api/invoices/${id}/credit-note`, {})
      .pipe(map(toInvoice));
  }

  deleteInvoice(id: string): Observable<void> {
    return this.http.delete<void>(`/api/invoices/${id}`);
  }

  createQuote(draft: QuoteDraft): Observable<Quote> {
    return this.http
      .post<BillingDocumentDto>('/api/quotes', this.quoteRequest(draft))
      .pipe(map(toQuote));
  }

  updateQuote(id: string, draft: QuoteDraft): Observable<Quote> {
    return this.http
      .put<BillingDocumentDto>(`/api/quotes/${id}`, this.quoteRequest(draft))
      .pipe(map(toQuote));
  }

  quoteAction(id: string, action: 'send' | 'accept' | 'refuse'): Observable<Quote> {
    return this.http.post<BillingDocumentDto>(`/api/quotes/${id}/${action}`, {}).pipe(map(toQuote));
  }

  quoteToInvoice(id: string): Observable<Invoice> {
    return this.http.post<BillingDocumentDto>(`/api/quotes/${id}/invoice`, {}).pipe(map(toInvoice));
  }

  deleteQuote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/quotes/${id}`);
  }

  payments(invoiceId: string): Observable<Payment[]> {
    return this.http
      .get<PaymentDto[]>(`/api/payments/invoice/${invoiceId}`)
      .pipe(map((items) => items.map(toPayment)));
  }

  createPayment(payment: Omit<Payment, 'id'>): Observable<Payment> {
    return this.http.post<PaymentDto>('/api/payments', payment).pipe(map(toPayment));
  }

  deletePayment(id: string): Observable<void> {
    return this.http.delete<void>(`/api/payments/${id}`);
  }

  reminderRules(): Observable<ReminderStep[]> {
    return this.http
      .get<ReminderRuleDto[]>('/api/reminders/rules')
      .pipe(map((items) => items.map(toReminderRule)));
  }

  reminders(invoiceId: string): Observable<Reminder[]> {
    return this.http
      .get<ReminderDto[]>(`/api/reminders/invoice/${invoiceId}`)
      .pipe(map((items) => items.map(toReminder)));
  }

  toggleReminderRule(id: string, active: boolean): Observable<ReminderStep> {
    return this.http
      .patch<ReminderRuleDto>(`/api/reminders/rules/${id}`, { active })
      .pipe(map(toReminderRule));
  }

  reminderAction(id: string, action: 'send' | 'cancel'): Observable<Reminder> {
    return this.http.post<ReminderDto>(`/api/reminders/${id}/${action}`, {}).pipe(map(toReminder));
  }

  createReminder(
    invoiceId: string,
    ruleId: string,
    scheduledDate: string,
    content: string,
    sendNow: boolean,
  ): Observable<Reminder> {
    return this.http
      .post<ReminderDto>('/api/reminders', {
        invoiceId,
        ruleId,
        scheduledAt: `${scheduledDate}T09:00:00Z`,
        content,
        sendNow,
      })
      .pipe(map(toReminder));
  }

  private invoiceRequest(draft: InvoiceDraft): BillingDocumentRequestDto {
    return this.documentRequest(
      draft,
      draft.issueDate,
      draft.dueDate,
      null,
      draft.quoteId,
      draft.depositPercent,
    );
  }

  private quoteRequest(draft: QuoteDraft): BillingDocumentRequestDto {
    return this.documentRequest(draft, draft.date, null, draft.expiryDate, null, 0);
  }

  private documentRequest(
    draft: Pick<
      InvoiceDraft,
      | 'brandId'
      | 'campaignId'
      | 'terms'
      | 'lines'
      | 'globalDiscount'
      | 'vatApplicable'
      | 'extraTaxes'
      | 'draft'
    >,
    issueDate: string,
    dueDate: string | null,
    validUntil: string | null,
    sourceDocumentId: string | null,
    depositPercent: number,
  ): BillingDocumentRequestDto {
    return {
      customerId: draft.brandId,
      projectId: draft.campaignId,
      sourceDocumentId,
      issueDate,
      dueDate,
      validUntil,
      depositPercent,
      terms: draft.terms,
      lines: draft.lines.map((item) => ({
        ...item,
        id: this.uuidOrNull(item.id),
        itemType: item.deliverableType,
      })),
      globalDiscount: draft.globalDiscount,
      vatApplicable: draft.vatApplicable,
      extraTaxes: draft.extraTaxes.map((tax) => ({ ...tax, id: this.uuidOrNull(tax.id) })),
      draft: draft.draft,
    };
  }

  private uuidOrNull(value: string): string | null {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : null;
  }
}
