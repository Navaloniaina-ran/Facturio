package fr.facturio.backend.shared.template.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.template.dto.*;
import fr.facturio.backend.shared.template.entity.*;
import fr.facturio.backend.shared.template.repository.*;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InvoiceTemplateService {
  private final InvoiceTemplateRepository templates;
  private final InvoiceTemplateVersionRepository versions;
  private final CurrentWorkspace current;

  public InvoiceTemplateService(
      InvoiceTemplateRepository templates,
      InvoiceTemplateVersionRepository versions,
      CurrentWorkspace current) {
    this.templates = templates;
    this.versions = versions;
    this.current = current;
  }

  public List<InvoiceTemplateResponse> list() {
    return templates
        .findAllByOrganizationIdAndArchivedAtIsNullOrderByUpdatedAtDesc(current.organizationId())
        .stream()
        .map(this::response)
        .toList();
  }

  public InvoiceTemplateResponse get(UUID id) {
    return response(find(id));
  }

  @Transactional
  public InvoiceTemplateResponse create(InvoiceTemplateRequest request) {
    UUID organizationId = current.organizationId();
    InvoiceTemplate template = new InvoiceTemplate();
    template.setId(UUID.randomUUID());
    template.setOrganizationId(organizationId);
    template.setName(request.name().trim());
    boolean first =
        templates
            .findAllByOrganizationIdAndArchivedAtIsNullOrderByUpdatedAtDesc(organizationId)
            .isEmpty();
    template.setDefaultTemplate(first);
    templates.save(template);
    saveVersion(template, request.templateJson(), "Version 1");
    return response(template);
  }

  @Transactional
  public InvoiceTemplateResponse update(UUID id, InvoiceTemplateRequest request) {
    InvoiceTemplate template = find(id);
    template.setName(request.name().trim());
    template.setCurrentVersion(template.getCurrentVersion() + 1);
    templates.save(template);
    saveVersion(template, request.templateJson(), "Version " + template.getCurrentVersion());
    return response(template);
  }

  @Transactional
  public InvoiceTemplateResponse duplicate(UUID id) {
    InvoiceTemplate source = find(id);
    InvoiceTemplateVersion sourceVersion = currentVersion(source);
    return create(
        new InvoiceTemplateRequest(source.getName() + " (copie)", sourceVersion.getTemplateJson()));
  }

  @Transactional
  public InvoiceTemplateResponse setDefault(UUID id) {
    InvoiceTemplate template = find(id);
    templates.clearDefault(current.organizationId());
    template.setDefaultTemplate(true);
    return response(templates.save(template));
  }

  @Transactional
  public void delete(UUID id) {
    InvoiceTemplate template = find(id);
    if (template.isDefaultTemplate()) {
      throw ApiException.conflict(
          "default_template", "Le modele par defaut ne peut pas etre supprime");
    }
    template.setArchivedAt(OffsetDateTime.now());
    templates.save(template);
  }

  public List<InvoiceTemplateVersionResponse> versions(UUID id) {
    InvoiceTemplate template = find(id);
    return versions.findAllByTemplateIdOrderByVersionDesc(template.getId()).stream()
        .map(this::versionResponse)
        .toList();
  }

  private void saveVersion(
      InvoiceTemplate template, tools.jackson.databind.JsonNode json, String label) {
    InvoiceTemplateVersion version = new InvoiceTemplateVersion();
    version.setId(UUID.randomUUID());
    version.setTemplateId(template.getId());
    version.setVersion(template.getCurrentVersion());
    version.setLabel(label);
    version.setTemplateJson(json.deepCopy());
    version.setCreatedBy(current.userId());
    versions.save(version);
  }

  private InvoiceTemplate find(UUID id) {
    return templates
        .findByIdAndOrganizationIdAndArchivedAtIsNull(id, current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Modele"));
  }

  private InvoiceTemplateVersion currentVersion(InvoiceTemplate template) {
    return versions
        .findByTemplateIdAndVersion(template.getId(), template.getCurrentVersion())
        .orElseThrow(() -> ApiException.notFound("Version du modele"));
  }

  private InvoiceTemplateResponse response(InvoiceTemplate template) {
    return new InvoiceTemplateResponse(
        template.getId(),
        template.getName(),
        template.isDefaultTemplate(),
        template.getUpdatedAt(),
        template.isPreset(),
        currentVersion(template).getTemplateJson());
  }

  private InvoiceTemplateVersionResponse versionResponse(InvoiceTemplateVersion version) {
    return new InvoiceTemplateVersionResponse(
        version.getId(),
        version.getTemplateId(),
        version.getVersion(),
        version.getLabel(),
        version.getTemplateJson(),
        version.getCreatedAt());
  }
}
