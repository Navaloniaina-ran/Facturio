package fr.facturio.backend.auth.service;

import fr.facturio.backend.auth.dto.*;
import fr.facturio.backend.common.enums.WorkspaceType;
import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.creator.profile.entity.CreatorProfile;
import fr.facturio.backend.creator.profile.repository.CreatorProfileRepository;
import fr.facturio.backend.shared.subscription.entity.Subscription;
import fr.facturio.backend.shared.subscription.repository.SubscriptionRepository;
import fr.facturio.backend.user.entity.User;
import fr.facturio.backend.user.repository.UserRepository;
import fr.facturio.backend.workspace.entity.*;
import fr.facturio.backend.workspace.repository.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository users;
  private final OrganizationRepository organizations;
  private final OrganizationMemberRepository members;
  private final CreatorProfileRepository creatorProfiles;
  private final SubscriptionRepository subscriptions;
  private final PasswordEncoder passwordEncoder;

  public AuthService(
      UserRepository users,
      OrganizationRepository organizations,
      OrganizationMemberRepository members,
      CreatorProfileRepository creatorProfiles,
      SubscriptionRepository subscriptions,
      PasswordEncoder passwordEncoder) {
    this.users = users;
    this.organizations = organizations;
    this.members = members;
    this.creatorProfiles = creatorProfiles;
    this.subscriptions = subscriptions;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public AuthenticatedAccount login(LoginRequest request) {
    String email = normalize(request.email());
    User user = users.findByEmailIgnoreCase(email).orElseThrow(AuthService::invalidCredentials);
    if (!user.isEnabled()
        || user.getPasswordHash() == null
        || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw invalidCredentials();
    }
    OrganizationMember member =
        members
            .findFirstByIdUserIdOrderByDefaultWorkspaceDescJoinedAtAsc(user.getId())
            .orElseThrow(
                () -> ApiException.forbidden("workspace_missing", "Aucun espace accessible"));
    Organization organization =
        organizations
            .findById(member.getId().organizationId())
            .orElseThrow(() -> ApiException.notFound("Organisation"));
    user.setLastLoginAt(OffsetDateTime.now());
    member.setLastAccessedAt(OffsetDateTime.now());
    return account(user, organization, member.getRole(), false);
  }

  @Transactional
  public AuthenticatedAccount signup(SignupRequest request) {
    String email = normalize(request.email());
    if (users.existsByEmailIgnoreCase(email)) {
      throw ApiException.conflict("email_already_used", "Cette adresse email est deja utilisee");
    }

    User user = new User();
    user.setId(UUID.randomUUID());
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setDisplayName(request.name().trim());
    user.setTermsAcceptedAt(OffsetDateTime.now());
    users.save(user);

    Organization organization = new Organization();
    organization.setId(UUID.randomUUID());
    organization.setWorkspaceType(WorkspaceType.CREATOR);
    organization.setLegalName(request.name().trim());
    organization.setTradingName(request.name().trim());
    organization.setEmail(email);
    organization.setCountryCode(request.countryCode());
    organization.setCurrencyCode(request.currency());
    organizations.save(organization);

    OrganizationMember member = new OrganizationMember();
    member.setId(new OrganizationMemberId(organization.getId(), user.getId()));
    member.setRole("OWNER");
    member.setDefaultWorkspace(true);
    members.save(member);

    CreatorProfile profile = new CreatorProfile();
    profile.setOrganizationId(organization.getId());
    profile.setHandle(request.handle());
    profile.setProfileType(request.profileType());
    profile.setNiche(request.niche());
    profile.setPlatforms(
        request.platforms() == null ? new ArrayList<>() : new ArrayList<>(request.platforms()));
    creatorProfiles.save(profile);

    Subscription subscription = new Subscription();
    subscription.setId(UUID.randomUUID());
    subscription.setOrganizationId(organization.getId());
    subscription.setStartDate(LocalDate.now());
    subscription.setTrialEndDate(LocalDate.now().plusDays(14));
    subscription.setNextBillingDate(LocalDate.now().plusDays(14));
    subscriptions.save(subscription);

    return account(user, organization, member.getRole(), true);
  }

  private static AuthenticatedAccount account(
      User user, Organization organization, String memberRole, boolean newAccount) {
    return new AuthenticatedAccount(
        user.getId(),
        organization.getId(),
        organization.getWorkspaceType(),
        memberRole,
        user.getPlatformRole(),
        user.getDisplayName(),
        user.getEmail(),
        newAccount);
  }

  private static String normalize(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private static ApiException invalidCredentials() {
    return new ApiException(
        HttpStatus.UNAUTHORIZED, "invalid_credentials", "Email ou mot de passe incorrect");
  }
}
