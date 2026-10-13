package fr.facturio.backend.auth.dto;

import fr.facturio.backend.common.enums.WorkspaceType;
import java.io.Serializable;
import java.util.UUID;

public record AuthenticatedAccount(
    UUID userId,
    UUID organizationId,
    WorkspaceType workspaceType,
    String memberRole,
    String platformRole,
    String displayName,
    String email,
    boolean newAccount)
    implements Serializable {}
