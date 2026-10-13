package fr.facturio.backend.auth.util;

import fr.facturio.backend.auth.dto.AuthenticatedAccount;
import fr.facturio.backend.common.enums.WorkspaceType;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class TokenUtil {
  private final JwtEncoder encoder;
  private final Duration ttl;

  public TokenUtil(JwtEncoder encoder, @Value("${facturio.jwt.ttl:PT12H}") Duration ttl) {
    this.encoder = encoder;
    this.ttl = ttl;
  }

  public String issue(AuthenticatedAccount account) {
    Instant now = Instant.now();
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer("facturio")
            .issuedAt(now)
            .expiresAt(now.plus(ttl))
            .subject(account.email())
            .claim("user_id", account.userId().toString())
            .claim("organization_id", account.organizationId().toString())
            .claim("workspace_type", account.workspaceType().name())
            .claim("member_role", account.memberRole())
            .claim("platform_role", account.platformRole())
            .claim("display_name", account.displayName())
            .claim("authorities", authorities(account))
            .build();
    return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
  }

  public Optional<AuthenticatedAccount> current(Authentication authentication) {
    if (!(authentication instanceof JwtAuthenticationToken jwt)
        || !authentication.isAuthenticated()) {
      return Optional.empty();
    }
    Jwt token = jwt.getToken();
    try {
      return Optional.of(
          new AuthenticatedAccount(
              UUID.fromString(token.getClaimAsString("user_id")),
              UUID.fromString(token.getClaimAsString("organization_id")),
              WorkspaceType.valueOf(token.getClaimAsString("workspace_type")),
              token.getClaimAsString("member_role"),
              token.getClaimAsString("platform_role"),
              token.getClaimAsString("display_name"),
              token.getSubject(),
              false));
    } catch (RuntimeException invalidClaims) {
      return Optional.empty();
    }
  }

  public List<String> authorities(AuthenticatedAccount account) {
    LinkedHashSet<String> roles = new LinkedHashSet<>();
    roles.add("ROLE_AUTHENTICATED");
    if ("SITE_ADMIN".equals(account.platformRole())) roles.add("ROLE_SITE_ADMIN");
    if (Set.of("OWNER", "ADMIN").contains(account.memberRole())) {
      roles.add("ROLE_WORKSPACE_ADMIN");
    } else if ("MANAGER".equals(account.memberRole())) {
      roles.add("ROLE_WORKSPACE_MANAGER");
    }

    if (account.workspaceType() == WorkspaceType.CREATOR) {
      roles.add("ROLE_CREATOR");
    } else {
      switch (account.memberRole()) {
        case "OWNER", "ADMIN" -> {
          roles.add("ROLE_BUSINESS_ADMIN");
        }
        case "MANAGER" -> {
          roles.add("ROLE_BUSINESS_MANAGER");
        }
        default -> roles.add("ROLE_BUSINESS_VIEWER");
      }
    }
    return List.copyOf(roles);
  }
}
