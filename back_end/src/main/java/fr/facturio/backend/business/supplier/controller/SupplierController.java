package fr.facturio.backend.business.supplier.controller;

import fr.facturio.backend.business.supplier.dto.*;
import fr.facturio.backend.business.supplier.service.SupplierService;
import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business/suppliers")
public class SupplierController {
  private final SupplierService service;

  public SupplierController(SupplierService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<SupplierResponse>>> list() {
    return ApiResponses.ok(service.list());
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<SupplierResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping
  ResponseEntity<ApiResponse<SupplierResponse>> create(
      @Valid @RequestBody SupplierRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<SupplierResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody SupplierRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
