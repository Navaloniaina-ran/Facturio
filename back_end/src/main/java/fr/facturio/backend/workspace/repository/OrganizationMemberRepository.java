package fr.facturio.backend.workspace.repository;

import fr.facturio.backend.workspace.entity.OrganizationMember;
import fr.facturio.backend.workspace.entity.OrganizationMemberId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationMemberRepository
    extends JpaRepository<OrganizationMember, OrganizationMemberId> {
  Optional<OrganizationMember> findFirstByIdUserIdOrderByDefaultWorkspaceDescJoinedAtAsc(
      UUID userId);

  List<OrganizationMember> findAllByIdOrganizationIdOrderByJoinedAtAsc(UUID organizationId);
}
