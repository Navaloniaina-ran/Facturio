package fr.facturio.backend.shared.reminder.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReminderResponse(
    UUID id,
    UUID invoiceId,
    UUID ruleId,
    OffsetDateTime scheduledAt,
    OffsetDateTime sentAt,
    String status,
    String recipientEmail,
    String subject,
    String content) {}
