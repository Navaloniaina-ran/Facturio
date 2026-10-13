package fr.facturio.backend.workspace.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.workspace.dto.*;
import fr.facturio.backend.workspace.entity.Organization;
import fr.facturio.backend.workspace.repository.OrganizationRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SettingsService {
  private final OrganizationRepository organizations;
  private final CurrentWorkspace current;

  public SettingsService(OrganizationRepository organizations, CurrentWorkspace current) {
    this.organizations = organizations;
    this.current = current;
  }

  public SettingsResponse get() {
    return response(find());
  }

  @Transactional
  public SettingsResponse update(SettingsRequest request) {
    Organization organization = find();
    organization.setTradingName(request.businessName().trim());
    organization.setAddressLine1(request.address());
    organization.setCountryCode(request.countryCode());
    organization.setTaxId(request.taxId());
    organization.setIban(request.bankDetails());
    organization.setLogoUrl(request.logo());
    organization.setAccentColor(request.accentColor());
    organization.setInvoicePrefix(request.invoicePrefix().toUpperCase(Locale.ROOT));
    organization.setQuotePrefix(request.quotePrefix().toUpperCase(Locale.ROOT));
    organization.setCreditNotePrefix(request.creditPrefix().toUpperCase(Locale.ROOT));
    organization.setDefaultPaymentTermsDays(request.defaultPaymentTermsDays());
    organization.setDefaultTerms(request.defaultTerms());
    organization.setLegalMentions(request.legalMentions());
    organization.setLatePaymentMention(request.latePaymentMention());
    organization.setVatExemptionMention(request.vatExemptionMention());
    organization.setInvoiceFooter(request.invoiceFooter());
    organization.setCurrencyCode(request.currency());
    return response(organizations.save(organization));
  }

  private Organization find() {
    return organizations
        .findById(current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Organisation"));
  }

  private SettingsResponse response(Organization organization) {
    return new SettingsResponse(
        organization.getTradingName(),
        organization.getAddressLine1(),
        organization.getCountryCode(),
        organization.getTaxId(),
        organization.getIban(),
        organization.getLogoUrl(),
        organization.getAccentColor(),
        organization.getInvoicePrefix(),
        organization.getQuotePrefix(),
        organization.getCreditNotePrefix(),
        organization.getDefaultPaymentTermsDays(),
        organization.getDefaultTerms(),
        organization.getLegalMentions(),
        organization.getLatePaymentMention(),
        organization.getVatExemptionMention(),
        organization.getInvoiceFooter(),
        organization.getCurrencyCode());
  }
}
