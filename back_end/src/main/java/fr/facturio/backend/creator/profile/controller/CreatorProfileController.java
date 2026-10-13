package fr.facturio.backend.creator.profile.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.creator.profile.dto.*;
import fr.facturio.backend.creator.profile.service.CreatorProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/creator-profile")
public class CreatorProfileController {
  private final CreatorProfileService service;

  public CreatorProfileController(CreatorProfileService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<CreatorProfileResponse>> get() {
    return ApiResponses.ok(service.get());
  }

  @PutMapping
  ResponseEntity<ApiResponse<CreatorProfileResponse>> update(
      @Valid @RequestBody CreatorProfileRequest request) {
    return ApiResponses.ok(service.update(request));
  }
}
