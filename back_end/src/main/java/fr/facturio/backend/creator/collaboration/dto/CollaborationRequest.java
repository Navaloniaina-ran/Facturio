package fr.facturio.backend.creator.collaboration.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CollaborationRequest(
    @NotNull UUID brandId,
    @NotBlank @Size(max = 200) String title,
    @Pattern(regexp = "SPONSORED|AMBASSADOR|UGC|EVENT|AFFILIATE") String type,
    @Pattern(regexp = "PROSPECT|NEGOTIATION|CONTRACT|IN_PROGRESS|DONE|LOST") String stage,
    @NotNull @PositiveOrZero BigDecimal estimatedAmount,
    @NotNull LocalDate contactDate,
    LocalDate nextStepDate,
    @Size(max = 1000) String nextStepNote,
    @Size(max = 5000) String notes) {}
