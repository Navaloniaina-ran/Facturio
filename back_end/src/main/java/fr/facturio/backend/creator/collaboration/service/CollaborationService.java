package fr.facturio.backend.creator.collaboration.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.creator.brand.entity.Brand;
import fr.facturio.backend.creator.brand.repository.BrandRepository;
import fr.facturio.backend.creator.campaign.dto.CampaignRequest;
import fr.facturio.backend.creator.campaign.dto.CampaignResponse;
import fr.facturio.backend.creator.campaign.entity.Campaign;
import fr.facturio.backend.creator.campaign.repository.CampaignRepository;
import fr.facturio.backend.creator.campaign.util.CampaignUtil;
import fr.facturio.backend.creator.collaboration.dto.*;
import fr.facturio.backend.creator.collaboration.entity.Collaboration;
import fr.facturio.backend.creator.collaboration.repository.CollaborationRepository;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CollaborationService {
  private final CollaborationRepository repository;
  private final BrandRepository brands;
  private final CampaignRepository campaigns;
  private final CurrentWorkspace current;

  public CollaborationService(
      CollaborationRepository repository,
      BrandRepository brands,
      CampaignRepository campaigns,
      CurrentWorkspace current) {
    this.repository = repository;
    this.brands = brands;
    this.campaigns = campaigns;
    this.current = current;
  }

  public List<CollaborationResponse> list() {
    return repository
        .findAllByOrganizationIdOrderByContactDateDesc(current.creatorOrganizationId())
        .stream()
        .map(this::response)
        .toList();
  }

  public CollaborationResponse get(UUID id) {
    return response(find(id));
  }

  @Transactional
  public CollaborationResponse create(CollaborationRequest request) {
    UUID organizationId = current.creatorOrganizationId();
    requireBrand(request.brandId(), organizationId);
    Collaboration collaboration = new Collaboration();
    collaboration.setId(UUID.randomUUID());
    collaboration.setOrganizationId(organizationId);
    update(collaboration, request);
    return response(repository.save(collaboration));
  }

  @Transactional
  public CollaborationResponse update(UUID id, CollaborationRequest request) {
    Collaboration collaboration = find(id);
    requireBrand(request.brandId(), current.creatorOrganizationId());
    update(collaboration, request);
    return response(repository.save(collaboration));
  }

  @Transactional
  public CollaborationResponse changeStage(UUID id, CollaborationStageRequest request) {
    Collaboration collaboration = find(id);
    collaboration.setStage(request.stage());
    return response(repository.save(collaboration));
  }

  /**
   * Une collaboration signee devient une campagne : celle-ci porte ensuite les livrables et la
   * facturation. Le lien est conserve des deux cotes et la collaboration passe en realisation.
   */
  @Transactional
  public CampaignResponse toCampaign(UUID id, CollaborationCampaignRequest request) {
    Collaboration collaboration = find(id);
    if (collaboration.getCampaignId() != null) {
      throw ApiException.conflict(
          "collaboration_already_campaign", "Cette collaboration a deja une campagne");
    }

    UUID organizationId = current.creatorOrganizationId();
    Brand brand = requireBrand(collaboration.getBrandId(), organizationId);
    Campaign campaign =
        campaigns.save(
            CampaignUtil.newCampaign(
                organizationId,
                new CampaignRequest(
                    collaboration.getBrandId(),
                    request.name(),
                    request.startDate(),
                    request.endDate(),
                    request.deliverables())));

    collaboration.setCampaignId(campaign.getId());
    collaboration.setStage("IN_PROGRESS");
    repository.save(collaboration);
    return CampaignUtil.toResponse(campaign, brand.getName());
  }

  @Transactional
  public void delete(UUID id) {
    repository.delete(find(id));
  }

  private void update(Collaboration collaboration, CollaborationRequest request) {
    collaboration.setBrandId(request.brandId());
    collaboration.setTitle(request.title().trim());
    collaboration.setType(request.type());
    collaboration.setStage(request.stage());
    collaboration.setEstimatedAmount(request.estimatedAmount());
    collaboration.setContactDate(request.contactDate());
    collaboration.setNextStepDate(request.nextStepDate());
    collaboration.setNextStepNote(request.nextStepNote());
    collaboration.setNotes(request.notes());
  }

  private Collaboration find(UUID id) {
    return repository
        .findByIdAndOrganizationId(id, current.creatorOrganizationId())
        .orElseThrow(() -> ApiException.notFound("Collaboration"));
  }

  private Brand requireBrand(UUID id, UUID organizationId) {
    return brands
        .findByIdAndOrganizationId(id, organizationId)
        .orElseThrow(() -> ApiException.notFound("Marque"));
  }

  private CollaborationResponse response(Collaboration collaboration) {
    String brandName =
        requireBrand(collaboration.getBrandId(), collaboration.getOrganizationId()).getName();
    boolean actionDue =
        collaboration.getNextStepDate() != null
            && !collaboration.getNextStepDate().isAfter(LocalDate.now())
            && !Set.of("DONE", "LOST").contains(collaboration.getStage());
    return new CollaborationResponse(
        collaboration.getId(),
        collaboration.getBrandId(),
        brandName,
        collaboration.getTitle(),
        collaboration.getType(),
        collaboration.getStage(),
        collaboration.getEstimatedAmount(),
        collaboration.getContactDate(),
        collaboration.getNextStepDate(),
        collaboration.getNextStepNote(),
        collaboration.getNotes(),
        collaboration.getCampaignId(),
        collaboration.getContractUrl(),
        actionDue);
  }
}
