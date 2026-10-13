package fr.facturio.backend.creator.profile.repository;

import fr.facturio.backend.creator.profile.entity.CreatorProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreatorProfileRepository extends JpaRepository<CreatorProfile, UUID> {}
