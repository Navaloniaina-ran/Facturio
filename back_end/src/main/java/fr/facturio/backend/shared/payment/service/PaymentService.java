package fr.facturio.backend.shared.payment.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.billing.entity.BillingDocument;
import fr.facturio.backend.shared.billing.repository.BillingDocumentRepository;
import fr.facturio.backend.shared.payment.dto.*;
import fr.facturio.backend.shared.payment.entity.Payment;
import fr.facturio.backend.shared.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PaymentService {
  private final PaymentRepository payments;
  private final BillingDocumentRepository documents;
  private final CurrentWorkspace current;

  public PaymentService(
      PaymentRepository payments, BillingDocumentRepository documents, CurrentWorkspace current) {
    this.payments = payments;
    this.documents = documents;
    this.current = current;
  }

  public List<PaymentResponse> list(UUID invoiceId) {
    requireInvoice(invoiceId);
    return payments
        .findAllByOrganizationIdAndDocumentIdOrderByPaidOnDesc(current.organizationId(), invoiceId)
        .stream()
        .map(this::response)
        .toList();
  }

  @Transactional
  public PaymentResponse create(PaymentRequest request) {
    BillingDocument document = requireInvoice(request.invoiceId());
    BigDecimal outstanding = document.getTotalAmount().subtract(document.getPaidAmount());
    if (request.amount().compareTo(outstanding) > 0) {
      throw ApiException.badRequest("payment_too_high", "Le paiement depasse le solde restant");
    }
    Payment payment = new Payment();
    payment.setId(UUID.randomUUID());
    payment.setOrganizationId(current.organizationId());
    payment.setDocumentId(document.getId());
    payment.setAmount(request.amount());
    payment.setCurrencyCode(document.getCurrencyCode());
    payment.setPaidOn(request.date());
    payment.setMethod(request.method());
    payment.setReference(request.reference());
    payment.setNote(request.note());
    payments.save(payment);
    document.setPaidAmount(document.getPaidAmount().add(request.amount()));
    document.setStatus(
        document.getPaidAmount().compareTo(document.getTotalAmount()) >= 0
            ? "PAID"
            : "PARTIALLY_PAID");
    documents.save(document);
    return response(payment);
  }

  @Transactional
  public void delete(UUID id) {
    Payment payment =
        payments
            .findByIdAndOrganizationId(id, current.organizationId())
            .orElseThrow(() -> ApiException.notFound("Paiement"));
    BillingDocument document = requireInvoice(payment.getDocumentId());
    document.setPaidAmount(
        document.getPaidAmount().subtract(payment.getAmount()).max(BigDecimal.ZERO));
    document.setStatus(document.getPaidAmount().signum() == 0 ? "SENT" : "PARTIALLY_PAID");
    documents.save(document);
    payments.delete(payment);
  }

  private BillingDocument requireInvoice(UUID id) {
    BillingDocument document =
        documents
            .findByIdAndOrganizationId(id, current.organizationId())
            .orElseThrow(() -> ApiException.notFound("Facture"));
    if (!"INVOICE".equals(document.getDocumentType())) throw ApiException.notFound("Facture");
    return document;
  }

  private PaymentResponse response(Payment payment) {
    return new PaymentResponse(
        payment.getId(),
        payment.getDocumentId(),
        payment.getAmount(),
        payment.getPaidOn(),
        payment.getMethod(),
        payment.getReference(),
        payment.getNote());
  }
}
