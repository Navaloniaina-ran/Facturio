package fr.facturio.backend.shared.subscription.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "platform_invoice")
@Getter
@Setter
@NoArgsConstructor
public class PlatformInvoice {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false)
  private UUID organizationId;

  @Column(name = "invoice_number", nullable = false, unique = true)
  private String number;

  @Column(name = "issue_date", nullable = false)
  private LocalDate date;

  @Column(name = "plan_code", nullable = false)
  private String plan;

  @Column(name = "billing_cycle", nullable = false)
  private String cycle;

  @Column(name = "currency_code", nullable = false)
  private String currencyCode;

  @Column(nullable = false)
  private BigDecimal amount;

  @Column(nullable = false)
  private String status;

  @Column(name = "pdf_url")
  private String pdfUrl;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
