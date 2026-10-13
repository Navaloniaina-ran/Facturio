package fr.facturio.backend.business.supplier.dto;

import fr.facturio.backend.business.supplier.entity.Supplier;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface SupplierMapper {
  SupplierResponse toResponse(Supplier supplier);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "organizationId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void update(SupplierRequest request, @MappingTarget Supplier supplier);
}
