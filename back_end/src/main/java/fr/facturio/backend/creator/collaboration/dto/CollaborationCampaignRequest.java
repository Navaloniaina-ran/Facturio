package fr.facturio.backend.creator.collaboration.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import tools.jackson.databind.JsonNode;

/**
 * Transformation d'une collaboration signee en campagne. La marque n'est pas reprise du corps de la
 * requete : elle vient de la collaboration elle-meme.
 */
public record CollaborationCampaignRequest(
    @NotBlank @Size(max = 200) String name,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull JsonNode deliverables) {}
