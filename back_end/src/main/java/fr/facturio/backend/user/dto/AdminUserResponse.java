package fr.facturio.backend.user.dto;

import java.util.UUID;

public record AdminUserResponse(
    UUID id, String name, String email, String platformRole, boolean enabled) {}
