package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_sequence")
@Getter
@Setter
@NoArgsConstructor
public class DocumentSequence {
  @EmbeddedId private DocumentSequenceId id;

  @Column(nullable = false, length = 20)
  private String prefix;

  @Column(name = "last_value", nullable = false)
  private long lastValue;
}
