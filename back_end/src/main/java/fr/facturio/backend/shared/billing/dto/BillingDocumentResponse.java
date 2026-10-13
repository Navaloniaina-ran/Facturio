package fr.facturio.backend.shared.billing.dto;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public record BillingDocumentResponse(
    UUID id,
    String kind,
    String number,
    UUID customerId,
    String customerName,
    String customerEmail,
    UUID projectId,
    UUID sourceDocumentId,
    LocalDate issueDate,
    LocalDate dueDate,
    LocalDate validUntil,
    String status,
    List<Line> lines,
    DiscountRequest globalDiscount,
    boolean vatApplicable,
    List<Tax> extraTaxes,
    BigDecimal depositPercent,
    String terms,
    OffsetDateTime sentAt,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal totalVat,
    BigDecimal total,
    BigDecimal paidAmount,
    BigDecimal outstanding,
    int daysOverdue,
    boolean editable) {
  public record Line(
      UUID id,
      String description,
      String itemType,
      BigDecimal quantity,
      BigDecimal unitPrice,
      String discountType,
      BigDecimal discountValue,
      BigDecimal vatRate,
      BigDecimal netAmount,
      BigDecimal taxAmount,
      BigDecimal totalAmount) {}

  public record Tax(UUID id, String label, BigDecimal rate, BigDecimal amount) {}
}
