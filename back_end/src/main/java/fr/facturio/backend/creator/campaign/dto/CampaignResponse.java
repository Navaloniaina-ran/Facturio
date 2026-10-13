package fr.facturio.backend.creator.campaign.dto;

import java.time.LocalDate;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

public record CampaignResponse(
    UUID id,
    UUID brandId,
    String brandName,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    String status,
    JsonNode deliverables,
    String contractUrl,
    boolean contractSigned) {}
