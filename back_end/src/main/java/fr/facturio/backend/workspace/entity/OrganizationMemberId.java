package fr.facturio.backend.workspace.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
public record OrganizationMemberId(UUID organizationId, UUID userId) implements Serializable {}
