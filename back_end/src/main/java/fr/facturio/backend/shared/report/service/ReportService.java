package fr.facturio.backend.shared.report.service;

import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.billing.entity.BillingDocument;
import fr.facturio.backend.shared.billing.repository.BillingDocumentRepository;
import fr.facturio.backend.shared.report.dto.*;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService {
  private final BillingDocumentRepository documents;
  private final CurrentWorkspace current;

  public ReportService(BillingDocumentRepository documents, CurrentWorkspace current) {
    this.documents = documents;
    this.current = current;
  }

  public RevenueReportResponse revenue() {
    Map<YearMonth, BigDecimal[]> months = new TreeMap<>();
    invoices()
        .forEach(
            document -> {
              BigDecimal[] values =
                  months.computeIfAbsent(
                      YearMonth.from(document.getIssueDate()),
                      ignored -> new BigDecimal[] {BigDecimal.ZERO, BigDecimal.ZERO});
              values[0] = values[0].add(document.getTotalAmount());
              values[1] = values[1].add(document.getPaidAmount());
            });
    return new RevenueReportResponse(
        months.entrySet().stream()
            .map(
                entry ->
                    new RevenueReportResponse.Month(
                        entry.getKey().toString(), entry.getValue()[0], entry.getValue()[1]))
            .toList());
  }

  public ReportSummaryResponse summary() {
    List<BillingDocument> invoices = invoices();
    BigDecimal invoiced = sum(invoices, BillingDocument::getTotalAmount);
    BigDecimal collected = sum(invoices, BillingDocument::getPaidAmount);
    BigDecimal outstanding = invoiced.subtract(collected);
    BigDecimal overdue =
        sum(
            invoices.stream().filter(document -> "OVERDUE".equals(document.getStatus())).toList(),
            document -> document.getTotalAmount().subtract(document.getPaidAmount()));
    return new ReportSummaryResponse(invoiced, collected, outstanding, overdue, invoices.size());
  }

  private List<BillingDocument> invoices() {
    return documents.findAllByOrganizationIdOrderByIssueDateDesc(current.organizationId()).stream()
        .filter(document -> "INVOICE".equals(document.getDocumentType()))
        .filter(document -> !Set.of("DRAFT", "CANCELLED").contains(document.getStatus()))
        .toList();
  }

  private static BigDecimal sum(
      List<BillingDocument> documents,
      java.util.function.Function<BillingDocument, BigDecimal> extractor) {
    return documents.stream().map(extractor).reduce(BigDecimal.ZERO, BigDecimal::add);
  }
}
