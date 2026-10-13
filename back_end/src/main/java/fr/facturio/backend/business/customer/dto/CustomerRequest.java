package fr.facturio.backend.business.customer.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CustomerRequest(
    @NotBlank @Pattern(regexp = "COMPANY|INDIVIDUAL") String kind,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 160) String contact,
    @Email @Size(max = 320) String email,
    @Size(max = 40) String phone,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    String addressLine1,
    String addressLine2,
    @Size(max = 30) String postalCode,
    @Size(max = 120) String city,
    @Pattern(regexp = "|\\d{9}") String siren,
    @Pattern(regexp = "|\\d{14}") String siret,
    @Size(max = 80) String vatNumber,
    @Size(max = 40) String legalForm,
    @PositiveOrZero BigDecimal shareCapital,
    @Size(max = 30) String activityCode,
    @Size(max = 120) String registryCity,
    @Min(0) @Max(60) int paymentTermsDays,
    @Size(max = 4000) String notes,
    boolean active,
    String deliveryAddressLine1,
    String deliveryAddressLine2,
    String deliveryPostalCode,
    String deliveryCity,
    @Pattern(regexp = "|[A-Z]{2}") String deliveryCountryCode,
    @PositiveOrZero BigDecimal creditLimit) {}
