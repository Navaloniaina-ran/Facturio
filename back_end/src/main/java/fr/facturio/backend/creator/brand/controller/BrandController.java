package fr.facturio.backend.creator.brand.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.creator.brand.dto.*;
import fr.facturio.backend.creator.brand.service.BrandService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/brands")
public class BrandController {
  private final BrandService service;

  public BrandController(BrandService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<BrandResponse>>> list() {
    return ApiResponses.ok(service.list(), "Liste des marques");
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<BrandResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping
  ResponseEntity<ApiResponse<BrandResponse>> create(@Valid @RequestBody BrandRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<BrandResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody BrandRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @PatchMapping("/{id}/reminders")
  ResponseEntity<ApiResponse<BrandResponse>> reminders(@PathVariable UUID id) {
    return ApiResponses.ok(service.toggleReminders(id));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
