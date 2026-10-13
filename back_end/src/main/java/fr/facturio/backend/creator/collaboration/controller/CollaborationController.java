package fr.facturio.backend.creator.collaboration.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.creator.campaign.dto.CampaignResponse;
import fr.facturio.backend.creator.collaboration.dto.*;
import fr.facturio.backend.creator.collaboration.service.CollaborationService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/collaborations")
public class CollaborationController {
  private final CollaborationService service;

  public CollaborationController(CollaborationService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<CollaborationResponse>>> list() {
    return ApiResponses.ok(service.list());
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<CollaborationResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping
  ResponseEntity<ApiResponse<CollaborationResponse>> create(
      @Valid @RequestBody CollaborationRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<CollaborationResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody CollaborationRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @PatchMapping("/{id}/stage")
  ResponseEntity<ApiResponse<CollaborationResponse>> stage(
      @PathVariable UUID id, @Valid @RequestBody CollaborationStageRequest request) {
    return ApiResponses.ok(service.changeStage(id, request));
  }

  @PostMapping("/{id}/campaign")
  ResponseEntity<ApiResponse<CampaignResponse>> toCampaign(
      @PathVariable UUID id, @Valid @RequestBody CollaborationCampaignRequest request) {
    return ApiResponses.created(service.toCampaign(id, request));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
