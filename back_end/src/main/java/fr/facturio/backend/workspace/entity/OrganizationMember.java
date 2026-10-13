package fr.facturio.backend.workspace.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "organization_member")
@Getter
@Setter
@NoArgsConstructor
public class OrganizationMember {
  @EmbeddedId private OrganizationMemberId id;

  @Column(name = "member_role", nullable = false, length = 20)
  private String role = "OWNER";

  @Column(name = "is_default", nullable = false)
  private boolean defaultWorkspace;

  @CreationTimestamp
  @Column(name = "joined_at", nullable = false, updatable = false)
  private OffsetDateTime joinedAt;

  @Column(name = "last_accessed_at")
  private OffsetDateTime lastAccessedAt;
}
