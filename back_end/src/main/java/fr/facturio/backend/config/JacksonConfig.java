package fr.facturio.backend.config;

import org.hibernate.cfg.AvailableSettings;
import org.hibernate.type.descriptor.WrapperOptions;
import org.hibernate.type.descriptor.java.JavaType;
import org.hibernate.type.format.FormatMapper;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

/**
 * Spring Boot 4 expose Jackson 3 ({@code tools.jackson}) : les types java.time sont geres
 * nativement et aucun module supplementaire n'est necessaire. Hibernate, lui, ne detecte
 * automatiquement que Jackson 2 ; on lui fournit donc un {@link FormatMapper} branche sur le mapper
 * de l'application pour que les colonnes JSON manipulent bien des {@code
 * tools.jackson.databind.JsonNode}.
 */
@Configuration
public class JacksonConfig {

  @Bean
  HibernatePropertiesCustomizer jsonFormatMapperCustomizer(ObjectMapper objectMapper) {
    return properties ->
        properties.put(
            AvailableSettings.JSON_FORMAT_MAPPER, new Jackson3FormatMapper(objectMapper));
  }

  /** Serialisation des colonnes {@code jsonb} via Jackson 3. */
  static final class Jackson3FormatMapper implements FormatMapper {
    private final ObjectMapper objectMapper;

    Jackson3FormatMapper(ObjectMapper objectMapper) {
      this.objectMapper = objectMapper;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T fromString(CharSequence source, JavaType<T> javaType, WrapperOptions options) {
      if (javaType.getJavaType() == String.class) return (T) source.toString();
      return objectMapper.readValue(
          source.toString(), objectMapper.constructType(javaType.getJavaType()));
    }

    @Override
    public <T> String toString(T value, JavaType<T> javaType, WrapperOptions options) {
      if (javaType.getJavaType() == String.class) return (String) value;
      return objectMapper.writeValueAsString(value);
    }
  }
}
