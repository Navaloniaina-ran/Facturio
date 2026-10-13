package fr.facturio.backend.shared.billing.repository;

import fr.facturio.backend.shared.billing.entity.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface DocumentSequenceRepository
    extends JpaRepository<DocumentSequence, DocumentSequenceId> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select sequence from DocumentSequence sequence where sequence.id=:id")
  Optional<DocumentSequence> findForUpdate(DocumentSequenceId id);
}
