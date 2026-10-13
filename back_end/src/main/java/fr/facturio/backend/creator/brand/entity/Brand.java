package fr.facturio.backend.creator.brand.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;

@Entity
@Table(name = "customer")
@SecondaryTable(
    name = "creator_brand",
    pkJoinColumns = @PrimaryKeyJoinColumn(name = "customer_id", referencedColumnName = "id"))
@Getter
@Setter
@NoArgsConstructor
public class Brand {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "organization_id", table = "creator_brand", nullable = false, updatable = false)
  private UUID brandOrganizationId;

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
  private String address;

  @Column(name = "payment_terms_days", nullable = false)
  private int paymentTermsDays;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "reminders_paused", table = "creator_brand", nullable = false)
  private boolean remindersPaused;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
