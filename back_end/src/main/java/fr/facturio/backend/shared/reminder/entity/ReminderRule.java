package fr.facturio.backend.shared.reminder.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "reminder_rule")
@Getter
@Setter
@NoArgsConstructor
public class ReminderRule {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "label_key", nullable = false, length = 120)
  private String labelKey;

  @Column(name = "step_position", nullable = false)
  private int position;

  @Column(name = "offset_days", nullable = false)
  private int offsetDays;

  @Column(nullable = false, length = 20)
  private String channel = "EMAIL";

  @Column(name = "template_key", nullable = false, length = 120)
  private String templateKey;

  @Column(nullable = false)
  private boolean active = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
