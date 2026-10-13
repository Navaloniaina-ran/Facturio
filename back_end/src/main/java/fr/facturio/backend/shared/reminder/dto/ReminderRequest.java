package fr.facturio.backend.shared.reminder.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ReminderRequest(
    @NotNull UUID invoiceId,
    @NotNull UUID ruleId,
    @NotNull OffsetDateTime scheduledAt,
    @Size(max = 10000) String content,
    boolean sendNow) {}
