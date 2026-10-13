package fr.facturio.backend.shared.billing.repository;

import fr.facturio.backend.shared.billing.entity.BillingDocument;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface BillingDocumentRepository extends JpaRepository<BillingDocument, UUID> {
  List<BillingDocument> findAllByOrganizationIdOrderByIssueDateDesc(UUID organizationId);

  @EntityGraph(attributePaths = {"lines", "taxes"})
  List<BillingDocument> findAllByOrganizationIdAndDocumentTypeOrderByIssueDateDesc(
      UUID organizationId, String documentType);

  @EntityGraph(attributePaths = {"lines", "taxes"})
  Optional<BillingDocument> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
