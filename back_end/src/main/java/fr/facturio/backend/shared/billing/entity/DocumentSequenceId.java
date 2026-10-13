package fr.facturio.backend.shared.billing.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
public record DocumentSequenceId(UUID organizationId, String documentType, short sequenceYear)
    implements Serializable {}
