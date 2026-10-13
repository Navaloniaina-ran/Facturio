package fr.facturio.backend.workspace.dto;

import jakarta.validation.constraints.*;

public record SettingsRequest(
    @NotBlank @Size(max = 200) String businessName,
    @Size(max = 255) String address,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    @Size(max = 80) String taxId,
    @Size(max = 120) String bankDetails,
    @Size(max = 1000) String logo,
    @Pattern(regexp = "#[0-9A-Fa-f]{6}") String accentColor,
    @Pattern(regexp = "[A-Za-z]{2,6}") String invoicePrefix,
    @Pattern(regexp = "[A-Za-z]{2,6}") String quotePrefix,
    @Pattern(regexp = "[A-Za-z]{2,6}") String creditPrefix,
    @Min(0) @Max(365) int defaultPaymentTermsDays,
    String defaultTerms,
    String legalMentions,
    String latePaymentMention,
    String vatExemptionMention,
    String invoiceFooter,
    @Pattern(regexp = "[A-Z]{3}") String currency) {}
