package fr.facturio.backend.creator.collaboration.repository;

import fr.facturio.backend.creator.collaboration.entity.Collaboration;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollaborationRepository extends JpaRepository<Collaboration, UUID> {
  List<Collaboration> findAllByOrganizationIdOrderByContactDateDesc(UUID organizationId);

  Optional<Collaboration> findByIdAndOrganizationId(UUID id, UUID organizationId);

  boolean existsByBrandId(UUID brandId);

  boolean existsByCampaignId(UUID campaignId);
}
