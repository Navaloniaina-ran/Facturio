package fr.facturio.backend.business.supplier.repository;

import fr.facturio.backend.business.supplier.entity.Supplier;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
  List<Supplier> findAllByOrganizationIdOrderByName(UUID organizationId);

  Optional<Supplier> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
