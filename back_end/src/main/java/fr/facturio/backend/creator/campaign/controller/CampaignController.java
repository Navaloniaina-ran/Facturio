package fr.facturio.backend.creator.campaign.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.creator.campaign.dto.*;
import fr.facturio.backend.creator.campaign.service.CampaignService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {
  private final CampaignService service;

  public CampaignController(CampaignService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<CampaignResponse>>> list() {
    return ApiResponses.ok(service.list());
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<CampaignResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping
  ResponseEntity<ApiResponse<CampaignResponse>> create(
      @Valid @RequestBody CampaignRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<CampaignResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody CampaignRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @PatchMapping("/{id}/status")
  ResponseEntity<ApiResponse<CampaignResponse>> status(
      @PathVariable UUID id, @Valid @RequestBody CampaignStatusRequest request) {
    return ApiResponses.ok(service.changeStatus(id, request));
  }

  @PostMapping("/{id}/duplicate")
  ResponseEntity<ApiResponse<CampaignResponse>> duplicate(@PathVariable UUID id) {
    return ApiResponses.created(service.duplicate(id));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
