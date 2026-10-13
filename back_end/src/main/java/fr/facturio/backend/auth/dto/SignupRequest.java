package fr.facturio.backend.auth.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public record SignupRequest(
    @NotBlank @Size(max = 160) String name,
    @Size(max = 160) String handle,
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(min = 8, max = 200) String password,
    @NotBlank @Pattern(regexp = "INFLUENCER|CREATOR|FREELANCE") String profileType,
    List<@Size(max = 80) String> platforms,
    @Size(max = 160) String niche,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
    @AssertTrue boolean termsAccepted) {}
