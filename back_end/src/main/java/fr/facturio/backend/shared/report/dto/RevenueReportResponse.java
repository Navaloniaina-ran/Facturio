package fr.facturio.backend.shared.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record RevenueReportResponse(List<Month> months) {
  public record Month(String month, BigDecimal invoiced, BigDecimal collected) {}
}
