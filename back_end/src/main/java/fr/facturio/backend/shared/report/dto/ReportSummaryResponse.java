package fr.facturio.backend.shared.report.dto;

import java.math.BigDecimal;

public record ReportSummaryResponse(
    BigDecimal invoiced,
    BigDecimal collected,
    BigDecimal outstanding,
    BigDecimal overdue,
    long invoiceCount) {}
