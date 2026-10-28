package fr.facturio.backend.shared.billing.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.billing.dto.*;
import fr.facturio.backend.shared.billing.service.BillingDocumentService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {
  private final BillingDocumentService service;

  public QuoteController(BillingDocumentService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<BillingDocumentResponse>>> list() {
    return ApiResponses.ok(service.list("QUOTE"), "Liste des devis");
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id, "QUOTE"));
  }

  @PostMapping
  ResponseEntity<ApiResponse<BillingDocumentResponse>> create(
      @Valid @RequestBody BillingDocumentRequest request) {
    return ApiResponses.created(service.create("QUOTE", request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody BillingDocumentRequest request) {
    return ApiResponses.ok(service.update(id, "QUOTE", request));
  }

  @PostMapping("/{id}/send")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> send(@PathVariable UUID id) {
    return ApiResponses.ok(service.changeStatus(id, "SENT"));
  }

  @PostMapping("/{id}/accept")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> accept(@PathVariable UUID id) {
    return ApiResponses.ok(service.changeStatus(id, "ACCEPTED"));
  }

  @PostMapping("/{id}/refuse")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> refuse(@PathVariable UUID id) {
    return ApiResponses.ok(service.changeStatus(id, "REFUSED"));
  }

  @PostMapping("/{id}/invoice")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> invoice(@PathVariable UUID id) {
    return ApiResponses.created(service.convert(id, "INVOICE"));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
