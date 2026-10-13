package fr.facturio.backend.shared.billing.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record BillingTaxRequest(
    UUID id,
    @NotBlank @Size(max = 160) String label,
    @NotNull @DecimalMin("-100") @DecimalMax("100") BigDecimal rate) {}
