package fr.facturio.backend.shared.template.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;

@Entity
@Table(name = "invoice_template_version")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceTemplateVersion {
  @Id private UUID id;

  @Column(name = "template_id", nullable = false, updatable = false)
  private UUID templateId;

  @Column(nullable = false)
  private int version;

  @Column(length = 80)
  private String label;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "template_json", nullable = false, columnDefinition = "jsonb")
  private JsonNode templateJson;

  @Column(name = "created_by")
  private UUID createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
