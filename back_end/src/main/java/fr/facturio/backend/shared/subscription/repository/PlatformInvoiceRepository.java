package fr.facturio.backend.shared.subscription.repository;

import fr.facturio.backend.shared.subscription.entity.PlatformInvoice;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformInvoiceRepository extends JpaRepository<PlatformInvoice, UUID> {
  List<PlatformInvoice> findAllByOrganizationIdOrderByDateDesc(UUID organizationId);
}
