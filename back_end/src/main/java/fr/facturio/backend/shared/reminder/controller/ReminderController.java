package fr.facturio.backend.shared.reminder.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.reminder.dto.*;
import fr.facturio.backend.shared.reminder.service.ReminderService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {
  private final ReminderService service;

  public ReminderController(ReminderService service) {
    this.service = service;
  }

  @GetMapping("/rules")
  ResponseEntity<ApiResponse<List<ReminderRuleResponse>>> rules() {
    return ApiResponses.ok(service.rules());
  }

  @PatchMapping("/rules/{id}")
  ResponseEntity<ApiResponse<ReminderRuleResponse>> updateRule(
      @PathVariable UUID id, @RequestBody ReminderRuleUpdateRequest request) {
    return ApiResponses.ok(service.updateRule(id, request));
  }

  @GetMapping("/invoice/{invoiceId}")
  ResponseEntity<ApiResponse<List<ReminderResponse>>> invoice(@PathVariable UUID invoiceId) {
    return ApiResponses.ok(service.byInvoice(invoiceId));
  }

  @PostMapping
  ResponseEntity<ApiResponse<ReminderResponse>> create(
      @Valid @RequestBody ReminderRequest request) {
    return ApiResponses.created(service.create(request));
  }

  @PostMapping("/{id}/send")
  ResponseEntity<ApiResponse<ReminderResponse>> send(@PathVariable UUID id) {
    return ApiResponses.ok(service.send(id));
  }

  @PostMapping("/{id}/cancel")
  ResponseEntity<ApiResponse<ReminderResponse>> cancel(@PathVariable UUID id) {
    return ApiResponses.ok(service.cancel(id));
  }
}
