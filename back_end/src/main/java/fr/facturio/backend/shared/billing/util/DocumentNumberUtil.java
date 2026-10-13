package fr.facturio.backend.shared.billing.util;

import fr.facturio.backend.shared.billing.entity.*;
import fr.facturio.backend.shared.billing.repository.DocumentSequenceRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DocumentNumberUtil {
  private final DocumentSequenceRepository sequences;

  public DocumentNumberUtil(DocumentSequenceRepository sequences) {
    this.sequences = sequences;
  }

  @Transactional
  public String next(UUID organizationId, String type, String prefix, LocalDate date) {
    short year = (short) date.getYear();
    DocumentSequenceId id = new DocumentSequenceId(organizationId, type, year);
    DocumentSequence sequence = sequences.findForUpdate(id).orElseGet(() -> create(id, prefix));
    sequence.setLastValue(sequence.getLastValue() + 1);
    sequences.save(sequence);
    return "%s-%d-%05d".formatted(sequence.getPrefix(), year, sequence.getLastValue());
  }

  private DocumentSequence create(DocumentSequenceId id, String prefix) {
    DocumentSequence sequence = new DocumentSequence();
    sequence.setId(id);
    sequence.setPrefix(prefix);
    return sequence;
  }
}
