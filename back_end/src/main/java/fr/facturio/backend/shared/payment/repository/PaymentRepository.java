package fr.facturio.backend.shared.payment.repository;

import fr.facturio.backend.shared.payment.entity.Payment;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
  List<Payment> findAllByOrganizationIdAndDocumentIdOrderByPaidOnDesc(
      UUID organizationId, UUID documentId);

  Optional<Payment> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
