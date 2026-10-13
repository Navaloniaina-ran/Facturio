package fr.facturio.backend.auth.dto;

import fr.facturio.backend.common.enums.WorkspaceType;

public record SessionResponse(
    String name,
    String email,
    WorkspaceType workspaceType,
    String memberRole,
    String platformRole,
    java.util.List<String> authorities,
    String accessToken,
    boolean newAccount) {
  public static SessionResponse from(
      AuthenticatedAccount account, String accessToken, java.util.List<String> authorities) {
    return new SessionResponse(
        account.displayName(),
        account.email(),
        account.workspaceType(),
        account.memberRole(),
        account.platformRole(),
        authorities,
        accessToken,
        account.newAccount());
  }
}
