package fr.facturio.backend.shared.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public record BillingDocumentRequest(
    @NotNull UUID customerId,
    UUID projectId,
    UUID sourceDocumentId,
    @NotNull LocalDate issueDate,
    LocalDate dueDate,
    LocalDate validUntil,
    @DecimalMin("0") @DecimalMax("100") BigDecimal depositPercent,
    @Size(max = 10000) String terms,
    @NotEmpty List<@Valid BillingLineRequest> lines,
    @NotNull @Valid DiscountRequest globalDiscount,
    boolean vatApplicable,
    @NotNull List<@Valid BillingTaxRequest> extraTaxes,
    boolean draft) {}
