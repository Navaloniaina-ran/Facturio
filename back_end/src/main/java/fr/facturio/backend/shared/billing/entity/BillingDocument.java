package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import lombok.*;
import org.hibernate.annotations.*;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;

@Entity
@Table(name = "billing_document")
@Getter
@Setter
@NoArgsConstructor
public class BillingDocument {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "customer_id")
  private UUID customerId;

  @Column(name = "project_id")
  private UUID projectId;

  @Column(name = "source_document_id")
  private UUID sourceDocumentId;

  @Column(name = "document_type", nullable = false, length = 20)
  private String documentType;

  @Column(nullable = false, length = 30)
  private String status = "DRAFT";

  @Column(name = "document_number", length = 60)
  private String documentNumber;

  @Column(name = "issue_date", nullable = false)
  private LocalDate issueDate;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Column(name = "valid_until")
  private LocalDate validUntil;

  @Column(name = "currency_code", nullable = false, length = 3)
  private String currencyCode = "EUR";

  @Column(name = "operation_nature", nullable = false, length = 20)
  private String operationNature = "SERVICES";

  @Column(name = "vat_applicable", nullable = false)
  private boolean vatApplicable;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "issuer_snapshot", nullable = false, columnDefinition = "jsonb")
  private JsonNode issuerSnapshot = JsonNodeFactory.instance.objectNode();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "customer_snapshot", nullable = false, columnDefinition = "jsonb")
  private JsonNode customerSnapshot = JsonNodeFactory.instance.objectNode();

  @Column(name = "template_version_id")
  private UUID templateVersionId;

  @Column(name = "global_discount_type", nullable = false, length = 10)
  private String globalDiscountType;

  @Column(name = "global_discount_value", nullable = false)
  private BigDecimal globalDiscountValue = BigDecimal.ZERO;

  @Column(name = "subtotal_amount", nullable = false)
  private BigDecimal subtotalAmount = BigDecimal.ZERO;

  @Column(name = "discount_amount", nullable = false)
  private BigDecimal discountAmount = BigDecimal.ZERO;

  @Column(name = "tax_amount", nullable = false)
  private BigDecimal taxAmount = BigDecimal.ZERO;

  @Column(name = "total_amount", nullable = false)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(name = "paid_amount", nullable = false)
  private BigDecimal paidAmount = BigDecimal.ZERO;

  @Column(name = "deposit_percent", nullable = false)
  private BigDecimal depositPercent = BigDecimal.ZERO;

  @Column(columnDefinition = "text")
  private String terms;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(name = "pdf_url")
  private String pdfUrl;

  @Column(name = "sent_at")
  private OffsetDateTime sentAt;

  @Column(name = "finalized_at")
  private OffsetDateTime finalizedAt;

  @OneToMany(
      mappedBy = "document",
      cascade = jakarta.persistence.CascadeType.ALL,
      orphanRemoval = true)
  @OrderBy("position asc")
  private Set<BillingLine> lines = new LinkedHashSet<>();

  @OneToMany(
      mappedBy = "document",
      cascade = jakarta.persistence.CascadeType.ALL,
      orphanRemoval = true)
  private Set<BillingTax> taxes = new LinkedHashSet<>();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  public void replaceLines(Collection<BillingLine> replacements) {
    lines.clear();
    replacements.forEach(
        line -> {
          line.setDocument(this);
          lines.add(line);
        });
  }

  public void replaceTaxes(Collection<BillingTax> replacements) {
    taxes.clear();
    replacements.forEach(
        tax -> {
          tax.setDocument(this);
          taxes.add(tax);
        });
  }
}
