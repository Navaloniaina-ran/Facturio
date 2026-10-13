package fr.facturio.backend.creator.campaign.entity;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.*;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;

@Entity
@Table(name = "project")
@SecondaryTable(
    name = "creator_campaign",
    pkJoinColumns = @PrimaryKeyJoinColumn(name = "project_id", referencedColumnName = "id"))
@Getter
@Setter
@NoArgsConstructor
public class Campaign {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "organization_id", table = "creator_campaign", nullable = false, updatable = false)
  private UUID campaignOrganizationId;

  @Column(name = "customer_id")
  private UUID brandId;

  @Column(name = "project_type", nullable = false, length = 30)
  private String projectType = "CAMPAIGN";

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, length = 30)
  private String status = "DRAFT";

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private JsonNode metadata = JsonNodeFactory.instance.objectNode();

  @Column(name = "contract_url", table = "creator_campaign", length = 1000)
  private String contractUrl;

  @Column(name = "contract_signed", table = "creator_campaign", nullable = false)
  private boolean contractSigned;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(table = "creator_campaign", nullable = false, columnDefinition = "jsonb")
  private JsonNode deliverables = JsonNodeFactory.instance.arrayNode();

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
