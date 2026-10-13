package fr.facturio.backend.creator.campaign.dto;

import jakarta.validation.constraints.Pattern;

public record CampaignStatusRequest(
    @Pattern(regexp = "DRAFT|PENDING|ACTIVE|COMPLETED|CANCELLED") String status) {}
