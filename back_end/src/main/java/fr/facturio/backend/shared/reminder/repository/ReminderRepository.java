package fr.facturio.backend.shared.reminder.repository;

import fr.facturio.backend.shared.reminder.entity.Reminder;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
  long countByOrganizationIdAndStatus(UUID organizationId, String status);

  List<Reminder> findAllByOrganizationIdAndDocumentIdOrderByScheduledAt(
      UUID organizationId, UUID documentId);

  Optional<Reminder> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
