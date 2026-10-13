package fr.facturio.backend.workspace.dto;

import java.util.UUID;

public record MemberResponse(UUID userId, String name, String email, String role) {}
