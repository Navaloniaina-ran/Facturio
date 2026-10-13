package fr.facturio.backend.business.customer.repository;

import fr.facturio.backend.business.customer.entity.Customer;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
  List<Customer> findAllByOrganizationIdOrderByName(UUID organizationId);

  Optional<Customer> findByIdAndOrganizationId(UUID id, UUID organizationId);

  @Query(
      value =
          "SELECT EXISTS(SELECT 1 FROM billing_document WHERE organization_id=:organizationId AND customer_id=:customerId)",
      nativeQuery = true)
  boolean hasDocuments(
      @Param("organizationId") UUID organizationId, @Param("customerId") UUID customerId);
}
