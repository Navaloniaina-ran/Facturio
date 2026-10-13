package fr.facturio.backend.shared.subscription.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.subscription.dto.*;
import fr.facturio.backend.shared.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {
  private final SubscriptionService service;

  public SubscriptionController(SubscriptionService service) {
    this.service = service;
  }

  @GetMapping
  ResponseEntity<ApiResponse<SubscriptionResponse>> get() {
    return ApiResponses.ok(service.get());
  }

  @PostMapping("/change")
  ResponseEntity<ApiResponse<SubscriptionResponse>> change(
      @Valid @RequestBody SubscriptionChangeRequest request) {
    return ApiResponses.ok(service.change(request));
  }

  @PostMapping("/cancel")
  ResponseEntity<ApiResponse<SubscriptionResponse>> cancel() {
    return ApiResponses.ok(service.cancel());
  }

  @GetMapping("/invoices")
  ResponseEntity<ApiResponse<List<PlatformInvoiceResponse>>> invoices() {
    return ApiResponses.ok(service.invoices());
  }
}
