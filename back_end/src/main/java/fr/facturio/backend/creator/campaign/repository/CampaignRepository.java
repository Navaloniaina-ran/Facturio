package fr.facturio.backend.creator.campaign.repository;

import fr.facturio.backend.creator.campaign.entity.Campaign;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
  List<Campaign> findAllByOrganizationIdOrderByStartDateDesc(UUID organizationId);

  Optional<Campaign> findByIdAndOrganizationId(UUID id, UUID organizationId);

  boolean existsByBrandId(UUID brandId);
}
