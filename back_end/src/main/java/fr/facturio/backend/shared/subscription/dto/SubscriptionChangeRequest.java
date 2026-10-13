package fr.facturio.backend.shared.subscription.dto;

import jakarta.validation.constraints.Pattern;

public record SubscriptionChangeRequest(
    @Pattern(regexp = "FREE|PRO|STUDIO") String plan,
    @Pattern(regexp = "MONTHLY|ANNUAL") String cycle) {}
