package fr.facturio.backend.auth.controller;

import fr.facturio.backend.auth.dto.*;
import fr.facturio.backend.auth.service.AuthService;
import fr.facturio.backend.auth.util.SessionUtil;
import fr.facturio.backend.auth.util.TokenUtil;
import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;
  private final SessionUtil sessionUtil;
  private final TokenUtil tokenUtil;

  public AuthController(AuthService authService, SessionUtil sessionUtil, TokenUtil tokenUtil) {
    this.authService = authService;
    this.sessionUtil = sessionUtil;
    this.tokenUtil = tokenUtil;
  }

  @PostMapping("/login")
  ResponseEntity<ApiResponse<SessionResponse>> login(
      @Valid @RequestBody LoginRequest body,
      HttpServletRequest request,
      HttpServletResponse response) {
    AuthenticatedAccount account = authService.login(body);
    return ApiResponses.ok(response(account));
  }

  @PostMapping("/signup")
  ResponseEntity<ApiResponse<SessionResponse>> signup(
      @Valid @RequestBody SignupRequest body,
      HttpServletRequest request,
      HttpServletResponse response) {
    AuthenticatedAccount account = authService.signup(body);
    return ApiResponses.created(response(account));
  }

  @PostMapping("/logout")
  ResponseEntity<ApiResponse<Void>> logout() {
    sessionUtil.close();
    return ApiResponses.deleted();
  }

  @GetMapping("/session")
  ResponseEntity<ApiResponse<SessionResponse>> session(HttpServletRequest request) {
    return sessionUtil
        .current(request.getSession(false))
        .map(account -> ApiResponses.ok(response(account)))
        .orElseGet(() -> ApiResponses.error(HttpStatus.UNAUTHORIZED, "Session absente", null));
  }

  private SessionResponse response(AuthenticatedAccount account) {
    return SessionResponse.from(account, tokenUtil.issue(account), tokenUtil.authorities(account));
  }
}
