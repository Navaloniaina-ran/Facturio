package fr.facturio.backend.creator.collaboration.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;

@Entity
@Table(name = "creator_collaboration")
@Getter
@Setter
@NoArgsConstructor
public class Collaboration {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "brand_id", nullable = false)
  private UUID brandId;

  @Column(name = "campaign_id")
  private UUID campaignId;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(name = "collaboration_type", nullable = false, length = 30)
  private String type;

  @Column(nullable = false, length = 30)
  private String stage;

  @Column(name = "estimated_amount", nullable = false)
  private BigDecimal estimatedAmount = BigDecimal.ZERO;

  @Column(name = "currency_code", nullable = false, length = 3)
  private String currencyCode = "EUR";

  @Column(name = "contact_date", nullable = false)
  private LocalDate contactDate;

  @Column(name = "next_step_date")
  private LocalDate nextStepDate;

  @Column(name = "next_step_note", columnDefinition = "text")
  private String nextStepNote;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(name = "contract_url", length = 1000)
  private String contractUrl;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
