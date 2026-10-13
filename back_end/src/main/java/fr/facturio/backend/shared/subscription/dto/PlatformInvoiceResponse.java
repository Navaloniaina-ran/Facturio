package fr.facturio.backend.shared.subscription.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PlatformInvoiceResponse(
    UUID id,
    String number,
    LocalDate date,
    String plan,
    String cycle,
    BigDecimal amount,
    String status) {}
