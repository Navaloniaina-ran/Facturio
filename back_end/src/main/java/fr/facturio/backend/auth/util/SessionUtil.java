package fr.facturio.backend.auth.util;

import fr.facturio.backend.auth.dto.AuthenticatedAccount;
import java.util.Optional;
import org.springframework.security.core.context.*;
import org.springframework.stereotype.Component;

@Component
public class SessionUtil {
  private final TokenUtil tokens;

  public SessionUtil(TokenUtil tokens) {
    this.tokens = tokens;
  }

  public Optional<AuthenticatedAccount> current(Object ignoredSession) {
    return tokens.current(SecurityContextHolder.getContext().getAuthentication());
  }

  public void close() {
    SecurityContextHolder.clearContext();
  }
}
