package fr.facturio.backend.shared.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentResponse(
    UUID id,
    UUID invoiceId,
    BigDecimal amount,
    LocalDate date,
    String method,
    String reference,
    String note) {}
