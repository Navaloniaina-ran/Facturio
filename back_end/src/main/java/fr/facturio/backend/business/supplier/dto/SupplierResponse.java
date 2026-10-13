package fr.facturio.backend.business.supplier.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SupplierResponse(
    UUID id,
    String kind,
    String name,
    String contact,
    String email,
    String phone,
    String countryCode,
    String addressLine1,
    String addressLine2,
    String postalCode,
    String city,
    String siren,
    String siret,
    String vatNumber,
    String legalForm,
    BigDecimal shareCapital,
    String activityCode,
    String registryCity,
    int paymentTermsDays,
    String iban,
    String defaultOperationNature,
    String notes,
    boolean active) {}
