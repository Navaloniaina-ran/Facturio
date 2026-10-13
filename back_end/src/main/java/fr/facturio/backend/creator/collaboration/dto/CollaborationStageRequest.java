package fr.facturio.backend.creator.collaboration.dto;

import jakarta.validation.constraints.Pattern;

public record CollaborationStageRequest(
    @Pattern(regexp = "PROSPECT|NEGOTIATION|CONTRACT|IN_PROGRESS|DONE|LOST") String stage) {}
