package fr.facturio.backend.common.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import fr.facturio.backend.auth.dto.AuthenticatedAccount;
import fr.facturio.backend.auth.util.SessionUtil;
import fr.facturio.backend.common.enums.WorkspaceType;
import fr.facturio.backend.common.exception.ApiException;
import jakarta.servlet.http.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class CurrentWorkspaceTest {
  @Test
  void rejectsCreatorFeatureForBusinessWorkspace() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpSession session = mock(HttpSession.class);
    SessionUtil sessions = mock(SessionUtil.class);
    when(request.getSession(false)).thenReturn(session);
    when(sessions.current(session))
        .thenReturn(
            Optional.of(
                new AuthenticatedAccount(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    WorkspaceType.BUSINESS,
                    "MANAGER",
                    "USER",
                    "Business",
                    "business@example.com",
                    false)));
    CurrentWorkspace current = new CurrentWorkspace(request, sessions);

    ApiException exception = assertThrows(ApiException.class, current::creatorOrganizationId);

    assertEquals(HttpStatus.FORBIDDEN, exception.status());
    assertEquals("workspace_type_forbidden", exception.code());
  }
}
