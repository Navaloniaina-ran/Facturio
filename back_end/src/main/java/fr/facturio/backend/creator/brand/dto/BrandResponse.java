package fr.facturio.backend.creator.brand.dto;

import java.util.UUID;

public record BrandResponse(
    UUID id,
    String name,
    String contact,
    String email,
    String phone,
    String address,
    String countryCode,
    int paymentTermsDays,
    String notes,
    boolean remindersPaused) {}
