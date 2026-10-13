package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;

@Entity
@Table(name = "billing_document_line")
@Getter
@Setter
@NoArgsConstructor
public class BillingLine {
  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private BillingDocument document;

  @Column(name = "line_position", nullable = false)
  private int position;

  @Column(nullable = false, columnDefinition = "text")
  private String description;

  @Column(name = "item_type", nullable = false, length = 30)
  private String itemType;

  @Column(nullable = false)
  private BigDecimal quantity;

  @Column(name = "unit_code", nullable = false, length = 20)
  private String unitCode = "UNIT";

  @Column(name = "unit_price", nullable = false)
  private BigDecimal unitPrice;

  @Column(name = "discount_type", nullable = false, length = 10)
  private String discountType;

  @Column(name = "discount_value", nullable = false)
  private BigDecimal discountValue;

  @Column(name = "vat_rate", nullable = false)
  private BigDecimal vatRate;

  @Column(name = "net_amount", nullable = false)
  private BigDecimal netAmount;

  @Column(name = "tax_amount", nullable = false)
  private BigDecimal taxAmount;

  @Column(name = "total_amount", nullable = false)
  private BigDecimal totalAmount;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private JsonNode metadata = JsonNodeFactory.instance.objectNode();
}
