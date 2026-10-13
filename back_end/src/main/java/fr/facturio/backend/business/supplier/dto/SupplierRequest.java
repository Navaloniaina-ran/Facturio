package fr.facturio.backend.business.supplier.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SupplierRequest(
    @NotBlank @Pattern(regexp = "COMPANY|INDIVIDUAL") String kind,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 160) String contact,
    @Email @Size(max = 320) String email,
    @Size(max = 40) String phone,
    @NotBlank @Pattern(regexp = "[A-Z]{2}") String countryCode,
    String addressLine1,
    String addressLine2,
    String postalCode,
    String city,
    @Pattern(regexp = "|\\d{9}") String siren,
    @Pattern(regexp = "|\\d{14}") String siret,
    String vatNumber,
    String legalForm,
    @PositiveOrZero BigDecimal shareCapital,
    String activityCode,
    String registryCity,
    @Min(0) @Max(60) int paymentTermsDays,
    String iban,
    @NotBlank @Pattern(regexp = "GOODS|SERVICES|MIXED") String defaultOperationNature,
    @Size(max = 4000) String notes,
    boolean active) {}
