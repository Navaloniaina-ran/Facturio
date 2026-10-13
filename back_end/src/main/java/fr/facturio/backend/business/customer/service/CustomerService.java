package fr.facturio.backend.business.customer.service;

import fr.facturio.backend.business.customer.dto.*;
import fr.facturio.backend.business.customer.dto.CustomerMapper;
import fr.facturio.backend.business.customer.entity.Customer;
import fr.facturio.backend.business.customer.repository.CustomerRepository;
import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CustomerService {
  private final CustomerRepository repository;
  private final CustomerMapper mapper;
  private final CurrentWorkspace current;

  public CustomerService(
      CustomerRepository repository, CustomerMapper mapper, CurrentWorkspace current) {
    this.repository = repository;
    this.mapper = mapper;
    this.current = current;
  }

  public List<CustomerResponse> list() {
    return repository.findAllByOrganizationIdOrderByName(current.businessOrganizationId()).stream()
        .map(mapper::toResponse)
        .toList();
  }

  public CustomerResponse get(UUID id) {
    return mapper.toResponse(find(id));
  }

  @Transactional
  public CustomerResponse create(CustomerRequest request) {
    UUID organizationId = current.businessOrganizationId();
    Customer customer = new Customer();
    customer.setId(UUID.randomUUID());
    customer.setOrganizationId(organizationId);
    customer.setDetailsOrganizationId(organizationId);
    mapper.update(request, customer);
    defaults(customer);
    return mapper.toResponse(repository.save(customer));
  }

  @Transactional
  public CustomerResponse update(UUID id, CustomerRequest request) {
    Customer customer = find(id);
    mapper.update(request, customer);
    defaults(customer);
    return mapper.toResponse(repository.save(customer));
  }

  @Transactional
  public void delete(UUID id) {
    Customer customer = find(id);
    if (repository.hasDocuments(current.businessOrganizationId(), id)) {
      throw ApiException.conflict("customer_has_documents", "Ce client possede des documents");
    }
    repository.delete(customer);
  }

  private Customer find(UUID id) {
    return repository
        .findByIdAndOrganizationId(id, current.businessOrganizationId())
        .orElseThrow(() -> ApiException.notFound("Client"));
  }

  private static void defaults(Customer customer) {
    if (customer.getShareCapital() == null) customer.setShareCapital(BigDecimal.ZERO);
    if (customer.getCreditLimit() == null) customer.setCreditLimit(BigDecimal.ZERO);
  }
}
