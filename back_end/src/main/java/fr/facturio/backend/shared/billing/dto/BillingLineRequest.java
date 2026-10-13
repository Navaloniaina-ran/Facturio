package fr.facturio.backend.shared.billing.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record BillingLineRequest(
    UUID id,
    @NotBlank @Size(max = 2000) String description,
    @Pattern(regexp = "REEL|STORY|POST|VIDEO|UGC|EVENT|SERVICE|GOODS") String itemType,
    @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal quantity,
    @NotNull @PositiveOrZero BigDecimal unitPrice,
    @Pattern(regexp = "PERCENT|AMOUNT") String discountType,
    @NotNull @PositiveOrZero BigDecimal discountValue,
    @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal vatRate) {}
