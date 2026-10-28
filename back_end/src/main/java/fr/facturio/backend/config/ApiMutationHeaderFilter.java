package fr.facturio.backend.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Set;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiMutationHeaderFilter extends OncePerRequestFilter {
  private static final Set<String> SAFE_METHODS =
      Set.of(HttpMethod.GET.name(), HttpMethod.HEAD.name(), HttpMethod.OPTIONS.name());

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    boolean mutation =
        request.getRequestURI().startsWith("/api/") && !SAFE_METHODS.contains(request.getMethod());
    if (mutation && !"XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType("application/json;charset=UTF-8");
      response
          .getWriter()
          .write(
              "{\"status\":403,\"message\":\"En-tete anti-CSRF absent\","
                  + "\"data\":{\"code\":\"csrf_header_missing\"}}");
      return;
    }
    chain.doFilter(request, response);
  }
}
