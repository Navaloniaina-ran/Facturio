package fr.facturio.backend.config;

import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, ApiMutationHeaderFilter mutationHeaderFilter) throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorization ->
                authorization
                    .requestMatchers("/api/auth/login", "/api/auth/signup", "/actuator/health")
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("SITE_ADMIN")
                    .requestMatchers("/api/workspace/members/**")
                    .hasAnyRole("WORKSPACE_ADMIN", "SITE_ADMIN")
                    .requestMatchers("/api/business/**")
                    .hasAnyRole("BUSINESS_ADMIN", "BUSINESS_MANAGER", "SITE_ADMIN")
                    .requestMatchers(
                        "/api/brands/**",
                        "/api/campaigns/**",
                        "/api/collaborations/**",
                        "/api/creator-profile/**")
                    .hasAnyRole("CREATOR", "SITE_ADMIN")
                    .requestMatchers(
                        HttpMethod.POST, "/api/subscription/change", "/api/subscription/cancel")
                    .hasAnyRole("CREATOR", "BUSINESS_ADMIN", "SITE_ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/**")
                    .authenticated()
                    .requestMatchers("/api/**")
                    .hasAnyRole("CREATOR", "BUSINESS_ADMIN", "BUSINESS_MANAGER", "SITE_ADMIN")
                    .anyRequest()
                    .permitAll())
        .exceptionHandling(handling -> handling.authenticationEntryPoint(unauthenticated()))
        .oauth2ResourceServer(
            resource ->
                resource
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                    .authenticationEntryPoint(unauthenticated()))
        .addFilterBefore(mutationHeaderFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  JwtDecoder jwtDecoder(@Value("${facturio.jwt.secret}") String secret) {
    return NimbusJwtDecoder.withSecretKey(secretKey(secret)).build();
  }

  @Bean
  JwtEncoder jwtEncoder(@Value("${facturio.jwt.secret}") String secret) {
    return NimbusJwtEncoder.withSecretKey(secretKey(secret)).build();
  }

  private SecretKey secretKey(String secret) {
    if (secret.length() < 32) {
      throw new IllegalStateException("JWT_SECRET doit contenir au moins 32 caracteres");
    }
    return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }

  private JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter granted = new JwtGrantedAuthoritiesConverter();
    granted.setAuthoritiesClaimName("authorities");
    granted.setAuthorityPrefix("");
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(granted);
    return converter;
  }

  /**
   * Sans session, la reponse est un 401 et non un 403 : le front distingue ainsi « reconnectez-vous
   * » de « cette ressource ne vous est pas ouverte ».
   */
  private AuthenticationEntryPoint unauthenticated() {
    return (request, response, exception) -> {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write("{\"code\":\"unauthenticated\",\"message\":\"Session requise\"}");
    };
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
