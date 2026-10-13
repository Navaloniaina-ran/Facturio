package fr.facturio.backend.creator.collaboration.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CollaborationResponse(
    UUID id,
    UUID brandId,
    String brandName,
    String title,
    String type,
    String stage,
    BigDecimal estimatedAmount,
    LocalDate contactDate,
    LocalDate nextStepDate,
    String nextStepNote,
    String notes,
    UUID campaignId,
    String contractUrl,
    boolean actionDue) {}
