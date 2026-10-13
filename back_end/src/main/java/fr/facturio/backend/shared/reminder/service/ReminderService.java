package fr.facturio.backend.shared.reminder.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.billing.entity.BillingDocument;
import fr.facturio.backend.shared.billing.entity.BillingParty;
import fr.facturio.backend.shared.billing.repository.BillingDocumentRepository;
import fr.facturio.backend.shared.billing.repository.BillingPartyRepository;
import fr.facturio.backend.shared.reminder.dto.*;
import fr.facturio.backend.shared.reminder.entity.*;
import fr.facturio.backend.shared.reminder.repository.*;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReminderService {
  private final ReminderRuleRepository rules;
  private final ReminderRepository reminders;
  private final CurrentWorkspace current;
  private final BillingDocumentRepository documents;
  private final BillingPartyRepository parties;

  public ReminderService(
      ReminderRuleRepository rules,
      ReminderRepository reminders,
      CurrentWorkspace current,
      BillingDocumentRepository documents,
      BillingPartyRepository parties) {
    this.rules = rules;
    this.reminders = reminders;
    this.current = current;
    this.documents = documents;
    this.parties = parties;
  }

  public List<ReminderRuleResponse> rules() {
    return rules.findAllByOrganizationIdOrderByPosition(current.organizationId()).stream()
        .map(this::ruleResponse)
        .toList();
  }

  @Transactional
  public ReminderRuleResponse updateRule(UUID id, ReminderRuleUpdateRequest request) {
    ReminderRule rule =
        rules
            .findByIdAndOrganizationId(id, current.organizationId())
            .orElseThrow(() -> ApiException.notFound("Regle de relance"));
    rule.setActive(request.active());
    return ruleResponse(rules.save(rule));
  }

  public List<ReminderResponse> byInvoice(UUID invoiceId) {
    return reminders
        .findAllByOrganizationIdAndDocumentIdOrderByScheduledAt(current.organizationId(), invoiceId)
        .stream()
        .map(this::response)
        .toList();
  }

  @Transactional
  public ReminderResponse create(ReminderRequest request) {
    BillingDocument document =
        documents
            .findByIdAndOrganizationId(request.invoiceId(), current.organizationId())
            .filter(item -> "INVOICE".equals(item.getDocumentType()))
            .orElseThrow(() -> ApiException.notFound("Facture"));
    rules
        .findByIdAndOrganizationId(request.ruleId(), current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Regle de relance"));
    BillingParty party =
        parties
            .findByIdAndOrganizationId(document.getCustomerId(), current.organizationId())
            .orElseThrow(() -> ApiException.notFound("Client"));
    if (party.getEmail() == null || party.getEmail().isBlank()) {
      throw ApiException.badRequest("recipient_missing", "Le client n'a pas d'adresse email");
    }

    OffsetDateTime now = OffsetDateTime.now();
    Reminder reminder = new Reminder();
    reminder.setId(UUID.randomUUID());
    reminder.setOrganizationId(current.organizationId());
    reminder.setDocumentId(document.getId());
    reminder.setRuleId(request.ruleId());
    reminder.setScheduledAt(request.scheduledAt());
    reminder.setRecipientEmail(party.getEmail());
    reminder.setSubject("Relance facture " + document.getDocumentNumber());
    reminder.setContent(request.content() == null ? "" : request.content());
    reminder.setStatus(request.sendNow() ? "SENT" : "SCHEDULED");
    reminder.setSentAt(request.sendNow() ? now : null);
    return response(reminders.save(reminder));
  }

  @Transactional
  public ReminderResponse send(UUID id) {
    Reminder reminder = find(id);
    reminder.setStatus("SENT");
    reminder.setSentAt(OffsetDateTime.now());
    return response(reminders.save(reminder));
  }

  @Transactional
  public ReminderResponse cancel(UUID id) {
    Reminder reminder = find(id);
    reminder.setStatus("CANCELLED");
    return response(reminders.save(reminder));
  }

  private Reminder find(UUID id) {
    return reminders
        .findByIdAndOrganizationId(id, current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Relance"));
  }

  private ReminderRuleResponse ruleResponse(ReminderRule rule) {
    return new ReminderRuleResponse(
        rule.getId(),
        rule.getLabelKey(),
        rule.getOffsetDays(),
        rule.getChannel(),
        rule.getTemplateKey(),
        rule.isActive());
  }

  private ReminderResponse response(Reminder reminder) {
    return new ReminderResponse(
        reminder.getId(),
        reminder.getDocumentId(),
        reminder.getRuleId(),
        reminder.getScheduledAt(),
        reminder.getSentAt(),
        reminder.getStatus(),
        reminder.getRecipientEmail(),
        reminder.getSubject(),
        reminder.getContent());
  }
}
