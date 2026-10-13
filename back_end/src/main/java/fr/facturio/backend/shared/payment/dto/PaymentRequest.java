package fr.facturio.backend.shared.payment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentRequest(
    @NotNull UUID invoiceId,
    @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal amount,
    @NotNull LocalDate date,
    @Pattern(regexp = "TRANSFER|MOBILE_MONEY|CARD|CASH|PAYPAL|CHECK|OTHER") String method,
    @Size(max = 160) String reference,
    @Size(max = 4000) String note) {}
