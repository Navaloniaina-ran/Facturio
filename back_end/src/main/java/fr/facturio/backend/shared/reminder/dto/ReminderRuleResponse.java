package fr.facturio.backend.shared.reminder.dto;

import java.util.UUID;

public record ReminderRuleResponse(
    UUID id, String labelKey, int offsetDays, String channel, String templateKey, boolean active) {}
