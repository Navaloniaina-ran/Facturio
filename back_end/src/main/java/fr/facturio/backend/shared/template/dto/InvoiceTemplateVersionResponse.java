package fr.facturio.backend.shared.template.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

public record InvoiceTemplateVersionResponse(
    UUID id,
    UUID templateId,
    int version,
    String label,
    JsonNode templateJson,
    OffsetDateTime createdAt) {}
