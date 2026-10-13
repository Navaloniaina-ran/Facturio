package fr.facturio.backend.business.supplier.service;

import fr.facturio.backend.business.supplier.dto.*;
import fr.facturio.backend.business.supplier.dto.SupplierMapper;
import fr.facturio.backend.business.supplier.entity.Supplier;
import fr.facturio.backend.business.supplier.repository.SupplierRepository;
import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SupplierService {
  private final SupplierRepository repository;
  private final SupplierMapper mapper;
  private final CurrentWorkspace current;

  public SupplierService(
      SupplierRepository repository, SupplierMapper mapper, CurrentWorkspace current) {
    this.repository = repository;
    this.mapper = mapper;
    this.current = current;
  }

  public List<SupplierResponse> list() {
    return repository.findAllByOrganizationIdOrderByName(current.businessOrganizationId()).stream()
        .map(mapper::toResponse)
        .toList();
  }

  public SupplierResponse get(UUID id) {
    return mapper.toResponse(find(id));
  }

  @Transactional
  public SupplierResponse create(SupplierRequest request) {
    Supplier supplier = new Supplier();
    supplier.setId(UUID.randomUUID());
    supplier.setOrganizationId(current.businessOrganizationId());
    mapper.update(request, supplier);
    if (supplier.getShareCapital() == null) supplier.setShareCapital(BigDecimal.ZERO);
    return mapper.toResponse(repository.save(supplier));
  }

  @Transactional
  public SupplierResponse update(UUID id, SupplierRequest request) {
    Supplier supplier = find(id);
    mapper.update(request, supplier);
    if (supplier.getShareCapital() == null) supplier.setShareCapital(BigDecimal.ZERO);
    return mapper.toResponse(repository.save(supplier));
  }

  @Transactional
  public void delete(UUID id) {
    repository.delete(find(id));
  }

  private Supplier find(UUID id) {
    return repository
        .findByIdAndOrganizationId(id, current.businessOrganizationId())
        .orElseThrow(() -> ApiException.notFound("Fournisseur"));
  }
}
