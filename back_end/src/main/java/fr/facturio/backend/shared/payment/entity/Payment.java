package fr.facturio.backend.shared.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
public class Payment {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "document_id", nullable = false, updatable = false)
  private UUID documentId;

  @Column(nullable = false)
  private BigDecimal amount;

  @Column(name = "currency_code", nullable = false, length = 3)
  private String currencyCode;

  @Column(name = "paid_on", nullable = false)
  private LocalDate paidOn;

  @Column(name = "payment_method", nullable = false, length = 30)
  private String method;

  @Column(length = 160)
  private String reference;

  @Column(columnDefinition = "text")
  private String note;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
