package fr.facturio.backend.creator.campaign.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.creator.brand.entity.Brand;
import fr.facturio.backend.creator.brand.repository.BrandRepository;
import fr.facturio.backend.creator.campaign.dto.*;
import fr.facturio.backend.creator.campaign.entity.Campaign;
import fr.facturio.backend.creator.campaign.repository.CampaignRepository;
import fr.facturio.backend.creator.campaign.util.CampaignUtil;
import fr.facturio.backend.creator.collaboration.repository.CollaborationRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CampaignService {
  private final CampaignRepository repository;
  private final BrandRepository brands;
  private final CollaborationRepository collaborations;
  private final CurrentWorkspace current;

  public CampaignService(
      CampaignRepository repository,
      BrandRepository brands,
      CollaborationRepository collaborations,
      CurrentWorkspace current) {
    this.repository = repository;
    this.brands = brands;
    this.collaborations = collaborations;
    this.current = current;
  }

  public List<CampaignResponse> list() {
    return repository
        .findAllByOrganizationIdOrderByStartDateDesc(current.creatorOrganizationId())
        .stream()
        .map(this::response)
        .toList();
  }

  public CampaignResponse get(UUID id) {
    return response(find(id));
  }

  @Transactional
  public CampaignResponse create(CampaignRequest request) {
    UUID organizationId = current.creatorOrganizationId();
    requireBrand(request.brandId(), organizationId);
    return response(repository.save(CampaignUtil.newCampaign(organizationId, request)));
  }

  @Transactional
  public CampaignResponse update(UUID id, CampaignRequest request) {
    Campaign campaign = find(id);
    requireBrand(request.brandId(), current.creatorOrganizationId());
    CampaignUtil.apply(campaign, request);
    return response(repository.save(campaign));
  }

  @Transactional
  public CampaignResponse changeStatus(UUID id, CampaignStatusRequest request) {
    Campaign campaign = find(id);
    campaign.setStatus(request.status());
    return response(repository.save(campaign));
  }

  @Transactional
  public CampaignResponse duplicate(UUID id) {
    Campaign source = find(id);
    Campaign copy = new Campaign();
    copy.setId(UUID.randomUUID());
    copy.setOrganizationId(source.getOrganizationId());
    copy.setCampaignOrganizationId(source.getOrganizationId());
    copy.setBrandId(source.getBrandId());
    copy.setName(source.getName() + " (copie)");
    copy.setStartDate(source.getStartDate());
    copy.setEndDate(source.getEndDate());
    copy.setDeliverables(source.getDeliverables().deepCopy());
    return response(repository.save(copy));
  }

  @Transactional
  public void delete(UUID id) {
    Campaign campaign = find(id);
    if (collaborations.existsByCampaignId(id)) {
      throw ApiException.conflict(
          "campaign_linked", "Cette campagne est rattachee a une collaboration");
    }
    repository.delete(campaign);
  }

  private Campaign find(UUID id) {
    return repository
        .findByIdAndOrganizationId(id, current.creatorOrganizationId())
        .orElseThrow(() -> ApiException.notFound("Campagne"));
  }

  private Brand requireBrand(UUID id, UUID organizationId) {
    return brands
        .findByIdAndOrganizationId(id, organizationId)
        .orElseThrow(() -> ApiException.notFound("Marque"));
  }

  private CampaignResponse response(Campaign campaign) {
    String brandName = requireBrand(campaign.getBrandId(), campaign.getOrganizationId()).getName();
    return CampaignUtil.toResponse(campaign, brandName);
  }
}
