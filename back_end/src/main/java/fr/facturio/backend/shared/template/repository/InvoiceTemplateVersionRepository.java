package fr.facturio.backend.shared.template.repository;

import fr.facturio.backend.shared.template.entity.InvoiceTemplateVersion;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceTemplateVersionRepository
    extends JpaRepository<InvoiceTemplateVersion, UUID> {
  Optional<InvoiceTemplateVersion> findByTemplateIdAndVersion(UUID templateId, int version);

  List<InvoiceTemplateVersion> findAllByTemplateIdOrderByVersionDesc(UUID templateId);
}
