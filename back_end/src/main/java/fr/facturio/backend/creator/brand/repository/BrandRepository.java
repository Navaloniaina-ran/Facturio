package fr.facturio.backend.creator.brand.repository;

import fr.facturio.backend.creator.brand.entity.Brand;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BrandRepository extends JpaRepository<Brand, UUID> {
  List<Brand> findAllByOrganizationIdOrderByName(UUID organizationId);

  Optional<Brand> findByIdAndOrganizationId(UUID id, UUID organizationId);

  @Query(
      value = "SELECT EXISTS(SELECT 1 FROM billing_document WHERE customer_id=:id)",
      nativeQuery = true)
  boolean hasDocuments(@Param("id") UUID id);
}
