package fr.facturio.backend.auth.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import fr.facturio.backend.auth.dto.AuthenticatedAccount;
import fr.facturio.backend.common.enums.WorkspaceType;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtEncoder;

class TokenUtilTest {
  private final TokenUtil tokens = new TokenUtil(mock(JwtEncoder.class), Duration.ofHours(1));

  @Test
  void grantsBusinessAdminOnlyToOwnersAndAdmins() {
    assertTrue(
        tokens
            .authorities(account(WorkspaceType.BUSINESS, "OWNER", "USER"))
            .contains("ROLE_BUSINESS_ADMIN"));
    assertTrue(
        tokens
            .authorities(account(WorkspaceType.BUSINESS, "MANAGER", "USER"))
            .contains("ROLE_BUSINESS_MANAGER"));
    assertFalse(
        tokens
            .authorities(account(WorkspaceType.BUSINESS, "VIEWER", "USER"))
            .contains("ROLE_BUSINESS_MANAGER"));
  }

  @Test
  void keepsSiteAdministrationSeparateFromWorkspaceRole() {
    var authorities = tokens.authorities(account(WorkspaceType.CREATOR, "MEMBER", "SITE_ADMIN"));
    assertTrue(authorities.contains("ROLE_SITE_ADMIN"));
    assertTrue(authorities.contains("ROLE_CREATOR"));
    assertFalse(authorities.contains("ROLE_WORKSPACE_ADMIN"));
  }

  private AuthenticatedAccount account(
      WorkspaceType workspace, String memberRole, String platformRole) {
    return new AuthenticatedAccount(
        UUID.randomUUID(),
        UUID.randomUUID(),
        workspace,
        memberRole,
        platformRole,
        "Test",
        "test@example.com",
        false);
  }
}
