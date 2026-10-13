package fr.facturio.backend.shared.template.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;

@Entity
@Table(name = "invoice_template")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceTemplate {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(nullable = false, length = 160)
  private String name;

  @Column(columnDefinition = "text")
  private String description;

  @Column(name = "is_default", nullable = false)
  private boolean defaultTemplate;

  @Column(name = "is_preset", nullable = false)
  private boolean preset;

  @Column(name = "current_version", nullable = false)
  private int currentVersion = 1;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Column(name = "archived_at")
  private OffsetDateTime archivedAt;
}
