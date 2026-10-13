package fr.facturio.backend.business.supplier.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;

@Entity
@Table(name = "business_supplier")
@Getter
@Setter
@NoArgsConstructor
public class Supplier {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "supplier_kind", nullable = false, length = 20)
  private String kind;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(name = "contact_name", length = 160)
  private String contact;

  @Column(length = 320)
  private String email;

  @Column(length = 40)
  private String phone;

  @Column(name = "country_code", nullable = false, length = 2)
  private String countryCode;

  @Column(name = "address_line_1")
  private String addressLine1;

  @Column(name = "address_line_2")
  private String addressLine2;

  @Column(name = "postal_code", length = 30)
  private String postalCode;

  @Column(length = 120)
  private String city;

  @Column(length = 20)
  private String siren;

  @Column(length = 20)
  private String siret;

  @Column(name = "vat_number", length = 80)
  private String vatNumber;

  @Column(name = "legal_form", length = 40)
  private String legalForm;

  @Column(name = "share_capital", nullable = false)
  private BigDecimal shareCapital = BigDecimal.ZERO;

  @Column(name = "activity_code", length = 30)
  private String activityCode;

  @Column(name = "registry_city", length = 120)
  private String registryCity;

  @Column(name = "payment_terms_days", nullable = false)
  private int paymentTermsDays;

  @Column(length = 80)
  private String iban;

  @Column(name = "default_operation_nature", nullable = false, length = 20)
  private String defaultOperationNature;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(nullable = false)
  private boolean active = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
