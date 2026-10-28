package fr.facturio.backend.shared.billing.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.billing.dto.*;
import fr.facturio.backend.shared.billing.service.BillingDocumentService;
import fr.facturio.backend.shared.billing.service.DocumentExportService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
  private final BillingDocumentService service;
  private final DocumentExportService exports;

  public InvoiceController(BillingDocumentService service, DocumentExportService exports) {
    this.service = service;
    this.exports = exports;
  }

  @GetMapping
  ResponseEntity<ApiResponse<List<BillingDocumentResponse>>> list() {
    return ApiResponses.ok(service.list("INVOICE"), "Liste des factures");
  }

  @GetMapping("/{id}")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id, "INVOICE"));
  }

  @PostMapping
  ResponseEntity<ApiResponse<BillingDocumentResponse>> create(
      @Valid @RequestBody BillingDocumentRequest request) {
    return ApiResponses.created(service.create("INVOICE", request));
  }

  @PutMapping("/{id}")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody BillingDocumentRequest request) {
    return ApiResponses.ok(service.update(id, "INVOICE", request));
  }

  @PostMapping("/{id}/send")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> send(@PathVariable UUID id) {
    return ApiResponses.ok(service.changeStatus(id, "SENT"));
  }

  @PostMapping("/{id}/cancel")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> cancel(@PathVariable UUID id) {
    return ApiResponses.ok(service.changeStatus(id, "CANCELLED"));
  }

  @PostMapping("/{id}/credit-note")
  ResponseEntity<ApiResponse<BillingDocumentResponse>> creditNote(@PathVariable UUID id) {
    return ApiResponses.created(service.convert(id, "CREDIT_NOTE"));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }

  @GetMapping(value = "/{id}/pdf", produces = "application/pdf")
  byte[] pdf(@PathVariable UUID id) {
    return exports.pdf(service.get(id, "INVOICE"));
  }

  @GetMapping(value = "/{id}/xml", produces = "application/xml")
  byte[] xml(@PathVariable UUID id) {
    return exports.xml(service.get(id, "INVOICE"));
  }

  @GetMapping(value = "/{id}/factur-x", produces = "application/pdf")
  byte[] facturX(@PathVariable UUID id) {
    return exports.pdf(service.get(id, "INVOICE"));
  }
}
