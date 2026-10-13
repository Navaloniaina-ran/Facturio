package fr.facturio.backend.creator.profile.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "creator_profile")
@Getter
@Setter
@NoArgsConstructor
public class CreatorProfile {
  @Id
  @Column(name = "organization_id")
  private UUID organizationId;

  @Column(length = 120)
  private String handle;

  @Column(name = "profile_type", nullable = false, length = 30)
  private String profileType = "CREATOR";

  @Column(length = 120)
  private String niche;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private List<String> platforms = new ArrayList<>();

  @Column(name = "vat_registered", nullable = false)
  private boolean vatRegistered;
}
