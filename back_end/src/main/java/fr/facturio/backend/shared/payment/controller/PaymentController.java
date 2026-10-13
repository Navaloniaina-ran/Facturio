package fr.facturio.backend.shared.payment.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.payment.dto.*;
import fr.facturio.backend.shared.payment.service.PaymentService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final PaymentService service;

  public PaymentController(PaymentService service) {
    this.service = service;
  }

  @GetMapping("/invoice/{invoiceId}")
  ResponseEntity<ApiResponse<List<PaymentResponse>>> list(@PathVariable UUID invoiceId) {
    return ApiResponses.ok(service.list(invoiceId));
  }

  @PostMapping
  ResponseEntity<ApiResponse<PaymentResponse>> create(@Valid @RequestBody PaymentRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
    service.delete(id);
    return ApiResponses.deleted();
  }
}
