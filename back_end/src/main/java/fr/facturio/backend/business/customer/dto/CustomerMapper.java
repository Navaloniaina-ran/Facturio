package fr.facturio.backend.business.customer.dto;

import fr.facturio.backend.business.customer.entity.Customer;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
  CustomerResponse toResponse(Customer customer);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "organizationId", ignore = true)
  @Mapping(target = "detailsOrganizationId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void update(CustomerRequest request, @MappingTarget Customer customer);
}
