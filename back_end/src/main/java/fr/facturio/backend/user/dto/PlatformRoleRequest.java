package fr.facturio.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PlatformRoleRequest(@NotBlank @Pattern(regexp = "USER|SITE_ADMIN") String role) {}
