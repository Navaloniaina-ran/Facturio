package fr.facturio.backend.shared.billing.repository;

import fr.facturio.backend.shared.billing.entity.BillingParty;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingPartyRepository extends JpaRepository<BillingParty, UUID> {
  Optional<BillingParty> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
