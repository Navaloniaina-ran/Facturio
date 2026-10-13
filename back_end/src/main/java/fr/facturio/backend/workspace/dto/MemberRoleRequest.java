package fr.facturio.backend.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MemberRoleRequest(
    @NotBlank @Pattern(regexp = "ADMIN|MANAGER|ACCOUNTANT|MEMBER|VIEWER") String role) {}
