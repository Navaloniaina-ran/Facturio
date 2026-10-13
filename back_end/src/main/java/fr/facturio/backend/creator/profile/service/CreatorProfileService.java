package fr.facturio.backend.creator.profile.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.creator.profile.dto.*;
import fr.facturio.backend.creator.profile.entity.CreatorProfile;
import fr.facturio.backend.creator.profile.repository.CreatorProfileRepository;
import fr.facturio.backend.shared.subscription.repository.SubscriptionRepository;
import fr.facturio.backend.user.entity.User;
import fr.facturio.backend.user.repository.UserRepository;
import fr.facturio.backend.workspace.entity.Organization;
import fr.facturio.backend.workspace.repository.OrganizationRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CreatorProfileService {
  private final CreatorProfileRepository profiles;
  private final OrganizationRepository organizations;
  private final UserRepository users;
  private final SubscriptionRepository subscriptions;
  private final CurrentWorkspace current;

  public CreatorProfileService(
      CreatorProfileRepository profiles,
      OrganizationRepository organizations,
      UserRepository users,
      SubscriptionRepository subscriptions,
      CurrentWorkspace current) {
    this.profiles = profiles;
    this.organizations = organizations;
    this.users = users;
    this.subscriptions = subscriptions;
    this.current = current;
  }

  public CreatorProfileResponse get() {
    UUID organizationId = current.creatorOrganizationId();
    return response(profile(organizationId), organization(organizationId));
  }

  @Transactional
  public CreatorProfileResponse update(CreatorProfileRequest request) {
    UUID organizationId = current.creatorOrganizationId();
    Organization organization = organization(organizationId);
    organization.setLegalName(request.name().trim());
    organization.setTradingName(request.name().trim());
    organization.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
    organization.setCountryCode(request.countryCode());
    organization.setCurrencyCode(request.currency());
    organizations.save(organization);

    CreatorProfile profile = profile(organizationId);
    profile.setHandle(request.handle());
    profile.setProfileType(request.subProfile());
    profile.setPlatforms(new ArrayList<>(request.platforms()));
    profile.setNiche(request.niche());
    profile.setVatRegistered(request.vatRegistered());
    profiles.save(profile);

    User user =
        users.findById(current.userId()).orElseThrow(() -> ApiException.notFound("Utilisateur"));
    user.setDisplayName(request.name().trim());
    user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
    users.save(user);
    return response(profile, organization);
  }

  private CreatorProfile profile(UUID id) {
    return profiles.findById(id).orElseThrow(() -> ApiException.notFound("Profil createur"));
  }

  private Organization organization(UUID id) {
    return organizations.findById(id).orElseThrow(() -> ApiException.notFound("Organisation"));
  }

  private CreatorProfileResponse response(CreatorProfile profile, Organization organization) {
    String plan =
        subscriptions
            .findByOrganizationId(organization.getId())
            .map(subscription -> subscription.getPlanCode())
            .orElse("FREE");
    return new CreatorProfileResponse(
        organization.getId(),
        organization.getTradingName(),
        profile.getHandle(),
        organization.getEmail(),
        profile.getProfileType(),
        profile.getPlatforms(),
        profile.getNiche(),
        organization.getCountryCode(),
        organization.getCurrencyCode(),
        profile.isVatRegistered(),
        plan);
  }
}
