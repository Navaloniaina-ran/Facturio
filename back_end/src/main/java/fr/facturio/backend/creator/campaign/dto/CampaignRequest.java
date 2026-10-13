package fr.facturio.backend.creator.campaign.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

public record CampaignRequest(
    @NotNull UUID brandId,
    @NotBlank @Size(max = 200) String name,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull JsonNode deliverables) {}
