package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "billing_document_tax")
@Getter
@Setter
@NoArgsConstructor
public class BillingTax {
  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private BillingDocument document;

  @Column(nullable = false, length = 160)
  private String label;

  @Column(nullable = false)
  private BigDecimal rate;

  @Column(name = "base_amount", nullable = false)
  private BigDecimal baseAmount;

  @Column(name = "tax_amount", nullable = false)
  private BigDecimal taxAmount;
}
