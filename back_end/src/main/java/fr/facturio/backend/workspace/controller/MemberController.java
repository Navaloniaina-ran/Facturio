package fr.facturio.backend.workspace.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.workspace.dto.*;
import fr.facturio.backend.workspace.service.MemberService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspace/members")
public class MemberController {
  private final MemberService service;

  public MemberController(MemberService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<MemberResponse>>> list() {
    return ApiResponses.ok(service.list(), "Liste des membres de l'espace");
  }

  @PostMapping
  ResponseEntity<ApiResponse<MemberResponse>> invite(
      @Valid @RequestBody MemberInviteRequest request) {
    return ApiResponses.created(service.invite(request));
  }

  @PatchMapping("/{userId}")
  ResponseEntity<ApiResponse<MemberResponse>> role(
      @PathVariable UUID userId, @Valid @RequestBody MemberRoleRequest request) {
    return ApiResponses.ok(service.changeRole(userId, request));
  }

  @DeleteMapping("/{userId}")
  ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID userId) {
    service.remove(userId);
    return ApiResponses.deleted();
  }
}
