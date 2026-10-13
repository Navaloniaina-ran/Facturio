package fr.facturio.backend.shared.reminder.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "reminder")
@Getter
@Setter
@NoArgsConstructor
public class Reminder {
  @Id private UUID id;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private UUID organizationId;

  @Column(name = "document_id", nullable = false, updatable = false)
  private UUID documentId;

  @Column(name = "rule_id")
  private UUID ruleId;

  @Column(name = "scheduled_at", nullable = false)
  private OffsetDateTime scheduledAt;

  @Column(name = "sent_at")
  private OffsetDateTime sentAt;

  @Column(nullable = false, length = 20)
  private String status = "SCHEDULED";

  @Column(name = "recipient_email", nullable = false, length = 320)
  private String recipientEmail;

  @Column(nullable = false, length = 255)
  private String subject;

  @Column(nullable = false, columnDefinition = "text")
  private String content;

  @Column(name = "failure_reason", columnDefinition = "text")
  private String failureReason;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
