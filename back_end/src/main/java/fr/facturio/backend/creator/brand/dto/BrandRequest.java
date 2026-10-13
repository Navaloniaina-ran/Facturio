package fr.facturio.backend.creator.brand.dto;

import jakarta.validation.constraints.*;

public record BrandRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 160) String contact,
    @Email @Size(max = 320) String email,
    @Size(max = 40) String phone,
    @Size(max = 255) String address,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    @Min(0) @Max(365) int paymentTermsDays,
    @Size(max = 4000) String notes) {}
