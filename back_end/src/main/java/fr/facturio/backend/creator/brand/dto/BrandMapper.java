package fr.facturio.backend.creator.brand.dto;

import fr.facturio.backend.creator.brand.entity.Brand;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface BrandMapper {
  BrandResponse toResponse(Brand brand);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "organizationId", ignore = true)
  @Mapping(target = "brandOrganizationId", ignore = true)
  @Mapping(target = "active", ignore = true)
  @Mapping(target = "remindersPaused", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void update(BrandRequest request, @MappingTarget Brand brand);
}
