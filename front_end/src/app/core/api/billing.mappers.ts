import {
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  Quote,
  QuoteStatus,
  Reminder,
  ReminderStatus,
  ReminderStep,
} from '../models';
import { BillingDocumentDto, PaymentDto, ReminderDto, ReminderRuleDto } from './api.dto';

const line = (item: BillingDocumentDto['lines'][number]) => ({
  id: item.id,
  description: item.description,
  deliverableType: item.itemType as Invoice['lines'][number]['deliverableType'],
  quantity: Number(item.quantity),
  unitPrice: Number(item.unitPrice),
  discountType: item.discountType,
  discountValue: Number(item.discountValue),
  vatRate: Number(item.vatRate),
});

export function toInvoice(dto: BillingDocumentDto): Invoice {
  return {
    id: dto.id,
    kind: dto.kind === 'CREDIT_NOTE' ? 'CREDIT_NOTE' : 'INVOICE',
    number: dto.number ?? '',
    brandId: dto.customerId,
    campaignId: dto.projectId,
    quoteId: dto.sourceDocumentId,
    issueDate: dto.issueDate,
    dueDate: dto.dueDate ?? dto.issueDate,
    status: dto.status as InvoiceStatus,
    lines: dto.lines.map(line),
    globalDiscount: { type: dto.globalDiscount.type, value: Number(dto.globalDiscount.value) },
    vatApplicable: dto.vatApplicable,
    extraTaxes: dto.extraTaxes.map((tax) => ({
      id: tax.id,
      label: tax.label,
      rate: Number(tax.rate),
    })),
    depositPercent: Number(dto.depositPercent ?? 0),
    terms: dto.terms ?? '',
    sentAt: dto.sentAt,
  };
}

export function toQuote(dto: BillingDocumentDto): Quote {
  return {
    id: dto.id,
    number: dto.number ?? '',
    brandId: dto.customerId,
    campaignId: dto.projectId,
    date: dto.issueDate,
    expiryDate: dto.validUntil ?? dto.issueDate,
    status: dto.status as QuoteStatus,
    lines: dto.lines.map(line),
    globalDiscount: { type: dto.globalDiscount.type, value: Number(dto.globalDiscount.value) },
    vatApplicable: dto.vatApplicable,
    extraTaxes: dto.extraTaxes.map((tax) => ({
      id: tax.id,
      label: tax.label,
      rate: Number(tax.rate),
    })),
    terms: dto.terms ?? '',
    // Le lien inverse est rÃ©tabli au chargement Ã  partir de la facture qui
    // porte `sourceDocumentId`; le devis source ne stocke pas cet identifiant.
    invoiceId: null,
  };
}

export const toPayment = (dto: PaymentDto): Payment => ({
  id: dto.id,
  invoiceId: dto.invoiceId,
  amount: Number(dto.amount),
  date: dto.date,
  method: dto.method as PaymentMethod,
  reference: dto.reference ?? '',
  note: dto.note ?? '',
});

export const toReminderRule = (dto: ReminderRuleDto): ReminderStep => ({ ...dto });

export const toReminder = (dto: ReminderDto): Reminder => ({
  id: dto.id,
  invoiceId: dto.invoiceId,
  stepId: dto.ruleId,
  scheduledDate: dto.scheduledAt.slice(0, 10),
  sentDate: dto.sentAt?.slice(0, 10) ?? null,
  status: dto.status as ReminderStatus,
  content: dto.content ?? '',
});
