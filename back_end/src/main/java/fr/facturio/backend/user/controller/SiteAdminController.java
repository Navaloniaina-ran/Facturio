package fr.facturio.backend.user.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.user.dto.*;
import fr.facturio.backend.user.entity.User;
import fr.facturio.backend.user.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Controller
@ResponseBody
@RequestMapping("/api/admin/users")
public class SiteAdminController {
  private final UserRepository users;

  public SiteAdminController(UserRepository users) {
    this.users = users;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<AdminUserResponse>>> list() {
    return ApiResponses.ok(users.findAll().stream().map(this::response).toList());
  }

  @PatchMapping("/{id}/role")
  @Transactional
  ResponseEntity<ApiResponse<AdminUserResponse>> role(
      @PathVariable UUID id, @Valid @RequestBody PlatformRoleRequest request) {
    User user = users.findById(id).orElseThrow(() -> ApiException.notFound("Utilisateur"));
    user.setPlatformRole(request.role());
    return ApiResponses.ok(response(users.save(user)));
  }

  private AdminUserResponse response(User user) {
    return new AdminUserResponse(
        user.getId(),
        user.getDisplayName(),
        user.getEmail(),
        user.getPlatformRole(),
        user.isEnabled());
  }
}
