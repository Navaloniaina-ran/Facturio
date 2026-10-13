package fr.facturio.backend.workspace.dto;

public record SettingsResponse(
    String businessName,
    String address,
    String countryCode,
    String taxId,
    String bankDetails,
    String logo,
    String accentColor,
    String invoicePrefix,
    String quotePrefix,
    String creditPrefix,
    int defaultPaymentTermsDays,
    String defaultTerms,
    String legalMentions,
    String latePaymentMention,
    String vatExemptionMention,
    String invoiceFooter,
    String currency) {}
