package fr.facturio.backend.business.customer.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CustomerResponse(
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
    String notes,
    boolean active,
    String deliveryAddressLine1,
    String deliveryAddressLine2,
    String deliveryPostalCode,
    String deliveryCity,
    String deliveryCountryCode,
    BigDecimal creditLimit) {}
