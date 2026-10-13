package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
public class BillingParty {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false)
  private UUID organizationId;

  @Column(nullable = false)
  private String name;

  @Column(name = "contact_name")
  private String contactName;

  private String email;
  private String phone;

  @Column(name = "country_code", nullable = false)
  private String countryCode;

  @Column(name = "address_line_1")
  private String addressLine1;

  @Column(name = "postal_code")
  private String postalCode;

  private String city;
}
