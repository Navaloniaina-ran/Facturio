package fr.facturio.backend.workspace.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.user.entity.User;
import fr.facturio.backend.user.repository.UserRepository;
import fr.facturio.backend.workspace.dto.*;
import fr.facturio.backend.workspace.entity.*;
import fr.facturio.backend.workspace.repository.OrganizationMemberRepository;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MemberService {
  private final OrganizationMemberRepository members;
  private final UserRepository users;
  private final CurrentWorkspace current;

  public MemberService(
      OrganizationMemberRepository members, UserRepository users, CurrentWorkspace current) {
    this.members = members;
    this.users = users;
    this.current = current;
  }

  public List<MemberResponse> list() {
    return members.findAllByIdOrganizationIdOrderByJoinedAtAsc(current.organizationId()).stream()
        .map(this::response)
        .toList();
  }

  @Transactional
  public MemberResponse invite(MemberInviteRequest request) {
    User user =
        users
            .findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> ApiException.notFound("Utilisateur"));
    OrganizationMemberId id = new OrganizationMemberId(current.organizationId(), user.getId());
    if (members.existsById(id)) {
      throw ApiException.conflict("member_already_exists", "Cet utilisateur est deja membre");
    }
    OrganizationMember member = new OrganizationMember();
    member.setId(id);
    member.setRole(request.role());
    return response(members.save(member));
  }

  @Transactional
  public MemberResponse changeRole(UUID userId, MemberRoleRequest request) {
    OrganizationMember member = require(userId);
    if ("OWNER".equals(member.getRole())) {
      throw ApiException.forbidden(
          "owner_role_locked", "Le proprietaire ne peut pas etre retrograde");
    }
    member.setRole(request.role());
    return response(members.save(member));
  }

  @Transactional
  public void remove(UUID userId) {
    OrganizationMember member = require(userId);
    if ("OWNER".equals(member.getRole())) {
      throw ApiException.forbidden(
          "owner_role_locked", "Le proprietaire ne peut pas etre supprime");
    }
    members.delete(member);
  }

  private OrganizationMember require(UUID userId) {
    return members
        .findById(new OrganizationMemberId(current.organizationId(), userId))
        .orElseThrow(() -> ApiException.notFound("Membre"));
  }

  private MemberResponse response(OrganizationMember member) {
    User user =
        users
            .findById(member.getId().userId())
            .orElseThrow(() -> ApiException.notFound("Utilisateur"));
    return new MemberResponse(
        user.getId(), user.getDisplayName(), user.getEmail(), member.getRole());
  }
}
