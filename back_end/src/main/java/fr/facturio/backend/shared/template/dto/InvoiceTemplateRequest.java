package fr.facturio.backend.shared.template.dto;

import jakarta.validation.constraints.*;
import tools.jackson.databind.JsonNode;

public record InvoiceTemplateRequest(
    @NotBlank @Size(max = 160) String name, @NotNull JsonNode templateJson) {}
