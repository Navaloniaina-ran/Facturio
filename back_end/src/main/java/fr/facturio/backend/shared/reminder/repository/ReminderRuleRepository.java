package fr.facturio.backend.shared.reminder.repository;

import fr.facturio.backend.shared.reminder.entity.ReminderRule;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRuleRepository extends JpaRepository<ReminderRule, UUID> {
  List<ReminderRule> findAllByOrganizationIdOrderByPosition(UUID organizationId);

  Optional<ReminderRule> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
