package fr.facturio.backend.creator.profile.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record CreatorProfileRequest(
    @NotBlank @Size(max = 160) String name,
    @Size(max = 120) String handle,
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "INFLUENCER|CREATOR|FREELANCE") String subProfile,
    @NotNull @Size(max = 12) List<String> platforms,
    @Size(max = 120) String niche,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
    boolean vatRegistered) {}
