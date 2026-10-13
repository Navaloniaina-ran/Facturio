package fr.facturio.backend.shared.billing.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.billing.dto.*;
import fr.facturio.backend.shared.billing.entity.*;
import fr.facturio.backend.shared.billing.repository.*;
import fr.facturio.backend.shared.billing.util.DocumentNumberUtil;
import fr.facturio.backend.shared.billing.util.FinancialCalculator;
import fr.facturio.backend.workspace.entity.Organization;
import fr.facturio.backend.workspace.repository.OrganizationRepository;
import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
@Transactional(readOnly = true)
public class BillingDocumentService {
  private final BillingDocumentRepository documents;
  private final BillingPartyRepository parties;
  private final OrganizationRepository organizations;
  private final FinancialCalculator calculator;
  private final DocumentNumberUtil numbers;
  private final CurrentWorkspace current;
  private final ObjectMapper json;

  public BillingDocumentService(
      BillingDocumentRepository documents,
      BillingPartyRepository parties,
      OrganizationRepository organizations,
      FinancialCalculator calculator,
      DocumentNumberUtil numbers,
      CurrentWorkspace current,
      ObjectMapper json) {
    this.documents = documents;
    this.parties = parties;
    this.organizations = organizations;
    this.calculator = calculator;
    this.numbers = numbers;
    this.current = current;
    this.json = json;
  }

  public List<BillingDocumentResponse> list(String type) {
    return documents
        .findAllByOrganizationIdAndDocumentTypeOrderByIssueDateDesc(current.organizationId(), type)
        .stream()
        .map(this::response)
        .toList();
  }

  public BillingDocumentResponse get(UUID id, String type) {
    BillingDocument document = find(id);
    if (!document.getDocumentType().equals(type)) throw ApiException.notFound("Document");
    return response(document);
  }

  @Transactional
  public BillingDocumentResponse create(String type, BillingDocumentRequest request) {
    UUID organizationId = current.organizationId();
    Organization organization =
        organizations
            .findById(organizationId)
            .orElseThrow(() -> ApiException.notFound("Organisation"));
    BillingParty party = requireParty(request.customerId(), organizationId);
    BillingDocument document = new BillingDocument();
    document.setId(UUID.randomUUID());
    document.setOrganizationId(organizationId);
    document.setDocumentType(type);
    document.setCurrencyCode(organization.getCurrencyCode());
    document.setIssuerSnapshot(json.valueToTree(organization));
    document.setCustomerSnapshot(json.valueToTree(party));
    apply(document, request, organization, party);
    return response(documents.save(document));
  }

  @Transactional
  public BillingDocumentResponse update(UUID id, String type, BillingDocumentRequest request) {
    BillingDocument document = find(id);
    if (!document.getDocumentType().equals(type)) throw ApiException.notFound("Document");
    if (!"DRAFT".equals(document.getStatus())) {
      throw ApiException.conflict(
          "document_locked", "Un document finalise ne peut plus etre modifie");
    }
    Organization organization =
        organizations
            .findById(current.organizationId())
            .orElseThrow(() -> ApiException.notFound("Organisation"));
    BillingParty party = requireParty(request.customerId(), current.organizationId());
    apply(document, request, organization, party);
    return response(documents.save(document));
  }

  @Transactional
  public BillingDocumentResponse changeStatus(UUID id, String status) {
    BillingDocument document = find(id);
    document.setStatus(status);
    if ("SENT".equals(status)) {
      finalizeNumber(document);
      document.setSentAt(OffsetDateTime.now());
    }
    if (!"DRAFT".equals(status) && document.getFinalizedAt() == null) {
      document.setFinalizedAt(OffsetDateTime.now());
    }
    return response(documents.save(document));
  }

  @Transactional
  public void delete(UUID id) {
    BillingDocument document = find(id);
    if (!"DRAFT".equals(document.getStatus())) {
      throw ApiException.conflict("document_locked", "Seul un brouillon peut etre supprime");
    }
    documents.delete(document);
  }

  @Transactional
  public BillingDocumentResponse convert(UUID id, String targetType) {
    BillingDocument source = find(id);
    List<BillingLineRequest> lines =
        source.getLines().stream()
            .map(
                line ->
                    new BillingLineRequest(
                        null,
                        line.getDescription(),
                        line.getItemType(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getDiscountType(),
                        line.getDiscountValue(),
                        line.getVatRate()))
            .toList();
    List<BillingTaxRequest> taxes =
        source.getTaxes().stream()
            .map(tax -> new BillingTaxRequest(null, tax.getLabel(), tax.getRate()))
            .toList();
    BillingDocumentRequest request =
        new BillingDocumentRequest(
            source.getCustomerId(),
            source.getProjectId(),
            source.getId(),
            LocalDate.now(),
            "INVOICE".equals(targetType) ? source.getDueDate() : LocalDate.now(),
            null,
            source.getDepositPercent(),
            source.getTerms(),
            lines,
            new DiscountRequest(source.getGlobalDiscountType(), source.getGlobalDiscountValue()),
            source.isVatApplicable(),
            taxes,
            // La conversion d'un devis produit un brouillon encore modifiable.
            // Un avoir, lui, est finalise immediatement et recoit son numero.
            "INVOICE".equals(targetType));
    source.setStatus("INVOICE".equals(targetType) ? "INVOICED" : "CANCELLED");
    documents.save(source);
    return create(targetType, request);
  }

  private void apply(
      BillingDocument document,
      BillingDocumentRequest request,
      Organization organization,
      BillingParty party) {
    FinancialCalculator.Totals totals = calculator.calculate(request);
    document.setCustomerId(party.getId());
    document.setProjectId(request.projectId());
    document.setSourceDocumentId(request.sourceDocumentId());
    document.setIssueDate(request.issueDate());
    document.setDueDate(request.dueDate());
    document.setValidUntil(request.validUntil());
    document.setDepositPercent(
        request.depositPercent() == null ? BigDecimal.ZERO : request.depositPercent());
    document.setTerms(request.terms());
    document.setVatApplicable(request.vatApplicable());
    document.setGlobalDiscountType(request.globalDiscount().type());
    document.setGlobalDiscountValue(request.globalDiscount().value());
    document.setSubtotalAmount(totals.subtotal());
    document.setDiscountAmount(totals.discount());
    document.setTaxAmount(totals.vat().add(totals.extraTaxes()));
    document.setTotalAmount(totals.total());
    document.setCustomerSnapshot(json.valueToTree(party));

    List<BillingLine> lines = new ArrayList<>();
    for (int index = 0; index < totals.lines().size(); index++) {
      FinancialCalculator.CalculatedLine calculated = totals.lines().get(index);
      BillingLineRequest source = calculated.source();
      BillingLine line = new BillingLine();
      line.setId(source.id() == null ? UUID.randomUUID() : source.id());
      line.setPosition(index);
      line.setDescription(source.description());
      line.setItemType(source.itemType());
      line.setQuantity(source.quantity());
      line.setUnitPrice(source.unitPrice());
      line.setDiscountType(source.discountType());
      line.setDiscountValue(source.discountValue());
      line.setVatRate(source.vatRate());
      line.setNetAmount(calculated.net());
      line.setTaxAmount(calculated.vat());
      line.setTotalAmount(calculated.total());
      lines.add(line);
    }
    document.replaceLines(lines);

    List<BillingTax> taxes =
        totals.taxes().stream()
            .map(
                calculated -> {
                  BillingTax tax = new BillingTax();
                  tax.setId(
                      calculated.source().id() == null
                          ? UUID.randomUUID()
                          : calculated.source().id());
                  tax.setLabel(calculated.source().label());
                  tax.setRate(calculated.source().rate());
                  tax.setBaseAmount(calculated.base());
                  tax.setTaxAmount(calculated.amount());
                  return tax;
                })
            .toList();
    document.replaceTaxes(taxes);

    if (!request.draft()) {
      finalizeNumber(document);
      document.setStatus("SENT");
      document.setFinalizedAt(OffsetDateTime.now());
    }
  }

  private void finalizeNumber(BillingDocument document) {
    if (document.getDocumentNumber() != null) return;
    Organization organization =
        organizations
            .findById(document.getOrganizationId())
            .orElseThrow(() -> ApiException.notFound("Organisation"));
    String prefix =
        switch (document.getDocumentType()) {
          case "QUOTE" -> organization.getQuotePrefix();
          case "CREDIT_NOTE" -> organization.getCreditNotePrefix();
          default -> organization.getInvoicePrefix();
        };
    document.setDocumentNumber(
        numbers.next(
            document.getOrganizationId(),
            document.getDocumentType(),
            prefix,
            document.getIssueDate()));
  }

  private BillingDocument find(UUID id) {
    return documents
        .findByIdAndOrganizationId(id, current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Document"));
  }

  private BillingParty requireParty(UUID id, UUID organizationId) {
    return parties
        .findByIdAndOrganizationId(id, organizationId)
        .orElseThrow(() -> ApiException.notFound("Client"));
  }

  private BillingDocumentResponse response(BillingDocument document) {
    BillingParty party = requireParty(document.getCustomerId(), document.getOrganizationId());
    List<BillingDocumentResponse.Line> lines =
        document.getLines().stream()
            .map(
                line ->
                    new BillingDocumentResponse.Line(
                        line.getId(),
                        line.getDescription(),
                        line.getItemType(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getDiscountType(),
                        line.getDiscountValue(),
                        line.getVatRate(),
                        line.getNetAmount(),
                        line.getTaxAmount(),
                        line.getTotalAmount()))
            .toList();
    List<BillingDocumentResponse.Tax> taxes =
        document.getTaxes().stream()
            .map(
                tax ->
                    new BillingDocumentResponse.Tax(
                        tax.getId(), tax.getLabel(), tax.getRate(), tax.getTaxAmount()))
            .toList();
    BigDecimal outstanding = document.getTotalAmount().subtract(document.getPaidAmount());
    int daysOverdue =
        document.getDueDate() != null
                && document.getDueDate().isBefore(LocalDate.now())
                && outstanding.signum() > 0
            ? (int) ChronoUnit.DAYS.between(document.getDueDate(), LocalDate.now())
            : 0;
    return new BillingDocumentResponse(
        document.getId(),
        document.getDocumentType(),
        document.getDocumentNumber(),
        party.getId(),
        party.getName(),
        party.getEmail(),
        document.getProjectId(),
        document.getSourceDocumentId(),
        document.getIssueDate(),
        document.getDueDate(),
        document.getValidUntil(),
        document.getStatus(),
        lines,
        new DiscountRequest(document.getGlobalDiscountType(), document.getGlobalDiscountValue()),
        document.isVatApplicable(),
        taxes,
        document.getDepositPercent(),
        document.getTerms(),
        document.getSentAt(),
        document.getSubtotalAmount(),
        document.getDiscountAmount(),
        document.getTaxAmount(),
        document.getTotalAmount(),
        document.getPaidAmount(),
        outstanding,
        daysOverdue,
        "DRAFT".equals(document.getStatus()));
  }
}
