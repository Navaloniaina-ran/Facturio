package fr.facturio.backend.shared.subscription.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "subscription")
@Getter
@Setter
@NoArgsConstructor
public class Subscription {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, unique = true, updatable = false)
  private UUID organizationId;

  @Column(name = "plan_code", nullable = false, length = 20)
  private String planCode = "FREE";

  @Column(nullable = false, length = 20)
  private String status = "TRIAL";

  @Column(name = "billing_cycle", nullable = false, length = 20)
  private String billingCycle = "MONTHLY";

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "trial_end_date")
  private LocalDate trialEndDate;

  @Column(name = "next_billing_date")
  private LocalDate nextBillingDate;

  @Column(name = "cancel_at_period_end", nullable = false)
  private boolean cancelAtPeriodEnd;

  @Column(name = "provider_customer_id")
  private String providerCustomerId;

  @Column(name = "provider_subscription_id")
  private String providerSubscriptionId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
