package fr.facturio.backend.creator.campaign.util;

import fr.facturio.backend.creator.campaign.dto.CampaignRequest;
import fr.facturio.backend.creator.campaign.dto.CampaignResponse;
import fr.facturio.backend.creator.campaign.entity.Campaign;
import java.util.UUID;

/**
 * Regles de construction partagees des campagnes : utilisees par le service campagne et par le
 * service collaboration sans que les services s'appellent entre eux.
 */
public final class CampaignUtil {
  private CampaignUtil() {}

  public static Campaign newCampaign(UUID organizationId, CampaignRequest request) {
    Campaign campaign = new Campaign();
    campaign.setId(UUID.randomUUID());
    campaign.setOrganizationId(organizationId);
    campaign.setCampaignOrganizationId(organizationId);
    apply(campaign, request);
    return campaign;
  }

  public static void apply(Campaign campaign, CampaignRequest request) {
    campaign.setBrandId(request.brandId());
    campaign.setName(request.name().trim());
    campaign.setStartDate(request.startDate());
    campaign.setEndDate(request.endDate());
    campaign.setDeliverables(request.deliverables());
  }

  public static CampaignResponse toResponse(Campaign campaign, String brandName) {
    return new CampaignResponse(
        campaign.getId(),
        campaign.getBrandId(),
        brandName,
        campaign.getName(),
        campaign.getStartDate(),
        campaign.getEndDate(),
        campaign.getStatus(),
        campaign.getDeliverables(),
        campaign.getContractUrl(),
        campaign.isContractSigned());
  }
}
