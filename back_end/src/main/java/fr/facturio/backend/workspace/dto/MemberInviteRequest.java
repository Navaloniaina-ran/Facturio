package fr.facturio.backend.workspace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MemberInviteRequest(
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "ADMIN|MANAGER|ACCOUNTANT|MEMBER|VIEWER") String role) {}
