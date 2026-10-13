package fr.facturio.backend.shared.billing.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record DiscountRequest(
    @Pattern(regexp = "PERCENT|AMOUNT") String type, @NotNull @PositiveOrZero BigDecimal value) {}
