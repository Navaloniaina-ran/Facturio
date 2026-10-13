import { Injectable, computed, inject } from '@angular/core';
import { today } from './calculations';
import { I18nService } from './i18n/i18n.service';
import { ActionResult, EmailLog } from './models';
import { WorkspaceStore } from './workspace-store.service';

export interface EmailDraft {
  documentType: EmailLog['documentType'];
  documentId: string;
  documentNumber: string;
  to: string;
  subject: string;
  body: string;
  withOutstanding: boolean;
}

/**
 * Envoi des documents par email. Le transport réel appartient à l'API
 * (fournisseur SMTP transactionnel) : ici l'envoi est journalisé, ce qui
 * suffit à démontrer le parcours et à historiser les échanges.
 */
@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly store = inject(WorkspaceStore);
  private readonly i18n = inject(I18nService);

  readonly history = computed(() =>
    this.store
      .emails()
      .slice()
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
  );

  historyFor(documentId: string): EmailLog[] {
    return this.history().filter((email) => email.documentId === documentId);
  }

  send(draft: EmailDraft): ActionResult<EmailLog> {
    if (!draft.to.includes('@')) {
      return { ok: false, errorKey: 'email.error.recipient' };
    }

    const email: EmailLog = { ...draft, id: this.store.newId('e'), sentAt: today() };
    this.store.emails.update((emails) => [email, ...emails]);
    this.store.log('EMAIL', 'email.flash.sent', { to: draft.to });

    return { ok: true, value: email };
  }

  /** Corps d'email pré-rempli, complété du reste à payer si demandé. */
  compose(options: {
    documentType: EmailLog['documentType'];
    number: string;
    contact: string;
    total: string;
    dueDate?: string;
    expiryDate?: string;
    outstanding?: string;
    paid?: string;
    withOutstanding: boolean;
  }): { subject: string; body: string } {
    const business = this.store.settings().businessName;

    const subject = this.i18n.t(
      options.documentType === 'INVOICE' ? 'email.subjectInvoice' : 'email.subjectQuote',
      { number: options.number, business },
    );

    let body =
      options.documentType === 'INVOICE'
        ? this.i18n.t('email.bodyInvoice', {
            contact: options.contact,
            number: options.number,
            total: options.total,
            due: options.dueDate ?? '',
            business,
          })
        : this.i18n.t('email.bodyQuote', {
            contact: options.contact,
            number: options.number,
            total: options.total,
            expiry: options.expiryDate ?? '',
            business,
          });

    if (options.withOutstanding && options.outstanding) {
      const reminder = this.i18n.t('email.outstandingLine', {
        outstanding: options.outstanding,
        paid: options.paid ?? '',
      });
      body = body.replace('\n\n', `\n\n${reminder}\n\n`);
    }

    return { subject, body };
  }
}
