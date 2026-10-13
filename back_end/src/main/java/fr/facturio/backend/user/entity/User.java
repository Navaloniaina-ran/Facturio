package fr.facturio.backend.user.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class User {
  @Id private UUID id;

  @Column(unique = true, length = 320)
  private String email;

  @Column(name = "password_hash")
  private String passwordHash;

  @Column(name = "display_name", nullable = false, length = 160)
  private String displayName;

  @Column(nullable = false, length = 10)
  private String locale = "fr-FR";

  @Column(name = "auth_provider", nullable = false, length = 20)
  private String authProvider = "LOCAL";

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(name = "platform_role", nullable = false, length = 20)
  private String platformRole = "USER";

  @Column(name = "email_verified_at")
  private OffsetDateTime emailVerifiedAt;

  @Column(name = "terms_accepted_at")
  private OffsetDateTime termsAcceptedAt;

  @Column(name = "last_login_at")
  private OffsetDateTime lastLoginAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
