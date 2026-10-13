package fr.facturio.backend.workspace.entity;

import fr.facturio.backend.common.enums.WorkspaceType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "organization")
@Getter
@Setter
@NoArgsConstructor
public class Organization {
  @Id private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "workspace_type", nullable = false, length = 20)
  private WorkspaceType workspaceType;

  @Column(name = "legal_name", nullable = false, length = 200)
  private String legalName;

  @Column(name = "trading_name", length = 200)
  private String tradingName;

  @Column(length = 320)
  private String email;

  @Column(length = 40)
  private String phone;

  @Column(name = "country_code", nullable = false, length = 2)
  private String countryCode;

  @Column(name = "currency_code", nullable = false, length = 3)
  private String currencyCode = "EUR";

  @Column(nullable = false, length = 60)
  private String timezone = "Europe/Paris";

  @Column(name = "registration_number", length = 80)
  private String registrationNumber;

  @Column(name = "tax_id", length = 80)
  private String taxId;

  @Column(name = "vat_number", length = 80)
  private String vatNumber;

  @Column(name = "address_line_1")
  private String addressLine1;

  @Column(name = "address_line_2")
  private String addressLine2;

  @Column(name = "postal_code", length = 30)
  private String postalCode;

  @Column(length = 120)
  private String city;

  @Column(length = 80)
  private String iban;

  @Column(length = 20)
  private String bic;

  @Column(name = "payment_instructions", columnDefinition = "text")
  private String paymentInstructions;

  @Column(name = "default_payment_terms_days", nullable = false)
  private int defaultPaymentTermsDays = 30;

  @Column(name = "default_terms", columnDefinition = "text")
  private String defaultTerms;

  @Column(name = "legal_mentions", columnDefinition = "text")
  private String legalMentions;

  @Column(name = "late_payment_mention", columnDefinition = "text")
  private String latePaymentMention;

  @Column(name = "vat_exemption_mention", columnDefinition = "text")
  private String vatExemptionMention;

  @Column(name = "invoice_footer", columnDefinition = "text")
  private String invoiceFooter;

  @Column(name = "invoice_prefix", nullable = false, length = 20)
  private String invoicePrefix = "FAC";

  @Column(name = "quote_prefix", nullable = false, length = 20)
  private String quotePrefix = "PRO";

  @Column(name = "credit_note_prefix", nullable = false, length = 20)
  private String creditNotePrefix = "AV";

  @Column(name = "accent_color", nullable = false, length = 7)
  private String accentColor = "#5B2FF0";

  @Column(name = "logo_url", length = 1000)
  private String logoUrl;

  @Column(name = "reminder_mode", nullable = false, length = 10)
  private String reminderMode = "MANUAL";

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Column(name = "archived_at")
  private OffsetDateTime archivedAt;
}
