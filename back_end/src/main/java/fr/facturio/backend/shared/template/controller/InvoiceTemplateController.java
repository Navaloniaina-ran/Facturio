package fr.facturio.backend.shared.template.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.template.dto.*;
import fr.facturio.backend.shared.template.service.*;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.*;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class InvoiceTemplateController {
  private final InvoiceTemplateService service;
  private final FileStorageService storage;

  public InvoiceTemplateController(InvoiceTemplateService service, FileStorageService storage) {
    this.service = service;
    this.storage = storage;
  }

  @GetMapping("/api/invoice-templates")
  ResponseEntity<ApiResponse<List<InvoiceTemplateResponse>>> list() {
    return ApiResponses.ok(service.list(), "Liste des modeles de facture");
  }

  @GetMapping("/api/invoice-templates/{id}")
  ResponseEntity<ApiResponse<InvoiceTemplateResponse>> get(@PathVariable UUID id) {
    return ApiResponses.ok(service.get(id));
  }

  @PostMapping("/api/invoice-templates")
  ResponseEntity<ApiResponse<InvoiceTemplateResponse>> create(
      @Valid @RequestBody InvoiceTemplateRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PutMapping("/api/invoice-templates/{id}")
  ResponseEntity<ApiResponse<InvoiceTemplateResponse>> update(
      @PathVariable UUID id, @Valid @RequestBody InvoiceTemplateRequest request) {
    return ApiResponses.ok(service.update(id, request));
  }

  @DeleteMapping("/api/invoice-templates/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }

  @PostMapping("/api/invoice-templates/{id}/duplicate")
  ResponseEntity<ApiResponse<InvoiceTemplateResponse>> duplicate(@PathVariable UUID id) {
    return ApiResponses.created(service.duplicate(id));
  }

  @PostMapping("/api/invoice-templates/{id}/default")
  ResponseEntity<ApiResponse<InvoiceTemplateResponse>> setDefault(@PathVariable UUID id) {
    return ApiResponses.ok(service.setDefault(id));
  }

  @GetMapping("/api/invoice-templates/{id}/versions")
  ResponseEntity<ApiResponse<List<InvoiceTemplateVersionResponse>>> versions(
      @PathVariable UUID id) {
    return ApiResponses.ok(service.versions(id), "Liste des versions du modele");
  }

  @PostMapping(
      value = "/api/invoice-templates/{id}/logo",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  ResponseEntity<ApiResponse<Map<String, String>>> upload(
      @PathVariable UUID id, @RequestParam("file") MultipartFile file) throws IOException {
    service.get(id);
    return ApiResponses.ok(
        Map.of("url", "/api/files/" + storage.storeLogo(file)), "Logo enregistre");
  }

  @GetMapping("/api/files/{name}")
  ResponseEntity<Resource> file(@PathVariable String name) throws IOException {
    return ResponseEntity.ok().contentType(storage.mediaType(name)).body(storage.load(name));
  }
}
