package fr.facturio.backend.common.util;

import fr.facturio.backend.auth.dto.AuthenticatedAccount;
import fr.facturio.backend.auth.util.SessionUtil;
import fr.facturio.backend.common.enums.WorkspaceType;
import fr.facturio.backend.common.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class CurrentWorkspace {
  private final HttpServletRequest request;
  private final SessionUtil sessions;

  public CurrentWorkspace(HttpServletRequest request, SessionUtil sessions) {
    this.request = request;
    this.sessions = sessions;
  }

  public AuthenticatedAccount account() {
    return sessions
        .current(request.getSession(false))
        .orElseThrow(
            () -> new ApiException(HttpStatus.UNAUTHORIZED, "unauthenticated", "Session absente"));
  }

  public UUID userId() {
    return account().userId();
  }

  public UUID organizationId() {
    return account().organizationId();
  }

  public UUID creatorOrganizationId() {
    return require(WorkspaceType.CREATOR);
  }

  public UUID businessOrganizationId() {
    return require(WorkspaceType.BUSINESS);
  }

  private UUID require(WorkspaceType expected) {
    AuthenticatedAccount account = account();
    if (account.workspaceType() != expected) {
      throw ApiException.forbidden(
          "workspace_type_forbidden", "Fonctionnalite indisponible dans cet espace");
    }
    return account.organizationId();
  }
}
