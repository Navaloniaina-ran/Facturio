package fr.facturio.backend.shared.template.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

public record InvoiceTemplateResponse(
    UUID id,
    String name,
    boolean isDefault,
    OffsetDateTime updatedAt,
    boolean isPreset,
    JsonNode templateJson) {}
