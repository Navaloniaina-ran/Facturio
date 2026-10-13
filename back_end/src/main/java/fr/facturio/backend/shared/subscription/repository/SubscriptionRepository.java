package fr.facturio.backend.shared.subscription.repository;

import fr.facturio.backend.shared.subscription.entity.Subscription;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
  Optional<Subscription> findByOrganizationId(UUID organizationId);
}
