package fr.facturio.backend.shared.subscription.dto;

import java.time.LocalDate;

public record SubscriptionResponse(
    String plan,
    String status,
    String cycle,
    LocalDate startDate,
    LocalDate trialEndDate,
    LocalDate nextBillingDate,
    boolean cancelAtPeriodEnd) {}
