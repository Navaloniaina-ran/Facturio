package fr.facturio.backend.creator.brand.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.creator.brand.dto.*;
import fr.facturio.backend.creator.brand.dto.BrandMapper;
import fr.facturio.backend.creator.brand.entity.Brand;
import fr.facturio.backend.creator.brand.repository.BrandRepository;
import fr.facturio.backend.creator.campaign.repository.CampaignRepository;
import fr.facturio.backend.creator.collaboration.repository.CollaborationRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BrandService {
  private final BrandRepository repository;
  private final CampaignRepository campaigns;
  private final CollaborationRepository collaborations;
  private final BrandMapper mapper;
  private final CurrentWorkspace current;

  public BrandService(
      BrandRepository repository,
      CampaignRepository campaigns,
      CollaborationRepository collaborations,
      BrandMapper mapper,
      CurrentWorkspace current) {
    this.repository = repository;
    this.campaigns = campaigns;
    this.collaborations = collaborations;
    this.mapper = mapper;
    this.current = current;
  }

  public List<BrandResponse> list() {
    return repository.findAllByOrganizationIdOrderByName(current.creatorOrganizationId()).stream()
        .map(mapper::toResponse)
        .toList();
  }

  public BrandResponse get(UUID id) {
    return mapper.toResponse(find(id));
  }

  @Transactional
  public BrandResponse create(BrandRequest request) {
    UUID organizationId = current.creatorOrganizationId();
    Brand brand = new Brand();
    brand.setId(UUID.randomUUID());
    brand.setOrganizationId(organizationId);
    brand.setBrandOrganizationId(organizationId);
    mapper.update(request, brand);
    return mapper.toResponse(repository.save(brand));
  }

  @Transactional
  public BrandResponse update(UUID id, BrandRequest request) {
    Brand brand = find(id);
    mapper.update(request, brand);
    return mapper.toResponse(repository.save(brand));
  }

  @Transactional
  public BrandResponse toggleReminders(UUID id) {
    Brand brand = find(id);
    brand.setRemindersPaused(!brand.isRemindersPaused());
    return mapper.toResponse(repository.save(brand));
  }

  @Transactional
  public void delete(UUID id) {
    Brand brand = find(id);
    if (repository.hasDocuments(id)) {
      throw ApiException.conflict("brand_has_documents", "Cette marque possede des documents");
    }
    // Sans ces gardes, la base repondrait par une violation de cle etrangere,
    // que l'ecran ne saurait pas traduire.
    if (campaigns.existsByBrandId(id) || collaborations.existsByBrandId(id)) {
      throw ApiException.conflict(
          "brand_linked", "Cette marque porte des campagnes ou des collaborations");
    }
    repository.delete(brand);
  }

  private Brand find(UUID id) {
    return repository
        .findByIdAndOrganizationId(id, current.creatorOrganizationId())
        .orElseThrow(() -> ApiException.notFound("Marque"));
  }
}
