package fr.facturio.backend.business.customer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;

@Entity
@Table(name = "customer")
@SecondaryTable(
    name = "business_customer",
    pkJoinColumns = @PrimaryKeyJoinColumn(name = "customer_id", referencedColumnName = "id"))
@Getter
@Setter
@NoArgsConstructor
public class Customer {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(
      name = "organization_id",
      table = "business_customer",
      nullable = false,
      updatable = false)
  private UUID detailsOrganizationId;

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

  @Column(name = "payment_terms_days", nullable = false)
  private int paymentTermsDays;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "customer_kind", table = "business_customer", nullable = false, length = 20)
  private String kind;

  @Column(table = "business_customer", length = 20)
  private String siren;

  @Column(table = "business_customer", length = 20)
  private String siret;

  @Column(name = "vat_number", table = "business_customer", length = 80)
  private String vatNumber;

  @Column(name = "legal_form", table = "business_customer", length = 40)
  private String legalForm;

  @Column(name = "share_capital", table = "business_customer", nullable = false)
  private BigDecimal shareCapital = BigDecimal.ZERO;

  @Column(name = "activity_code", table = "business_customer", length = 30)
  private String activityCode;

  @Column(name = "registry_city", table = "business_customer", length = 120)
  private String registryCity;

  @Column(name = "delivery_address_line_1", table = "business_customer")
  private String deliveryAddressLine1;

  @Column(name = "delivery_address_line_2", table = "business_customer")
  private String deliveryAddressLine2;

  @Column(name = "delivery_postal_code", table = "business_customer", length = 30)
  private String deliveryPostalCode;

  @Column(name = "delivery_city", table = "business_customer", length = 120)
  private String deliveryCity;

  @Column(name = "delivery_country_code", table = "business_customer", length = 2)
  private String deliveryCountryCode;

  @Column(name = "credit_limit", table = "business_customer", nullable = false)
  private BigDecimal creditLimit = BigDecimal.ZERO;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
