package fr.facturio.backend.shared.template.repository;

import fr.facturio.backend.shared.template.entity.InvoiceTemplate;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InvoiceTemplateRepository extends JpaRepository<InvoiceTemplate, UUID> {
  List<InvoiceTemplate> findAllByOrganizationIdAndArchivedAtIsNullOrderByUpdatedAtDesc(
      UUID organizationId);

  Optional<InvoiceTemplate> findByIdAndOrganizationIdAndArchivedAtIsNull(
      UUID id, UUID organizationId);

  @Modifying
  @Query(
      "update InvoiceTemplate template set template.defaultTemplate=false "
          + "where template.organizationId=:organizationId and template.defaultTemplate=true")
  void clearDefault(@Param("organizationId") UUID organizationId);
}
