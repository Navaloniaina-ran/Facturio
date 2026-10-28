package fr.facturio.backend.shared.report.controller;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import fr.facturio.backend.shared.report.dto.*;
import fr.facturio.backend.shared.report.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportService service;

  public ReportController(ReportService service) {
    this.service = service;
  }

  @GetMapping("/revenue")
  ResponseEntity<ApiResponse<RevenueReportResponse>> revenue() {
    return ApiResponses.ok(service.revenue(), "Chiffre d'affaires par mois");
  }

  @GetMapping("/summary")
  ResponseEntity<ApiResponse<ReportSummaryResponse>> summary() {
    return ApiResponses.ok(service.summary(), "Synthese des rapports");
  }
}
