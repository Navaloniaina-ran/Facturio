package fr.facturio.backend.workspace.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.template.service.FileStorageService;
import fr.facturio.backend.workspace.dto.*;
import fr.facturio.backend.workspace.service.SettingsService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
  private final SettingsService service;
  private final FileStorageService storage;

  public SettingsController(SettingsService service, FileStorageService storage) {
    this.service = service;
    this.storage = storage;
  }

  @GetMapping
  ResponseEntity<ApiResponse<SettingsResponse>> get() {
    return ApiResponses.ok(service.get());
  }

  @PutMapping
  ResponseEntity<ApiResponse<SettingsResponse>> update(
      @Valid @RequestBody SettingsRequest request) {
    return ApiResponses.ok(service.update(request));
  }

  /**
   * Le logo est stocke comme fichier : l'organisation n'en garde que l'URL. Le front envoie donc
   * l'image ici avant d'enregistrer les parametres.
   */
  @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  ResponseEntity<ApiResponse<Map<String, String>>> uploadLogo(
      @RequestParam("file") MultipartFile file) throws IOException {
    return ApiResponses.ok(Map.of("url", "/api/files/" + storage.storeLogo(file)));
  }
}
