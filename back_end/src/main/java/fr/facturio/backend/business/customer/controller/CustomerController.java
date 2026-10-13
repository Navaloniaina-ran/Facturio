package fr.facturio.backend.business.customer.controller;

import fr.facturio.backend.business.customer.dto.*;
import fr.facturio.backend.business.customer.service.CustomerService;
import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business/customers")
public class CustomerController {
  private final CustomerService service;

  public CustomerController(CustomerService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<CustomerResponse>>> list() {
    return ApiResponses.ok(service.list());
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<CustomerResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping
  ResponseEntity<ApiResponse<CustomerResponse>> create(
      @Valid @RequestBody CustomerRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<CustomerResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody CustomerRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
