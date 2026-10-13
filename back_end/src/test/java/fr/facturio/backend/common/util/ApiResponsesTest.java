package fr.facturio.backend.common.util;

import static org.junit.jupiter.api.Assertions.*;

import fr.facturio.backend.common.dto.ApiResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class ApiResponsesTest {
  @Test
  void okWrapsDataWithStatusAndMessage() {
    ResponseEntity<ApiResponse<List<String>>> response = ApiResponses.ok(List.of("a"));

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(200, response.getBody().status());
    assertEquals("Operation reussie", response.getBody().message());
    assertEquals(List.of("a"), response.getBody().data());
  }

  @Test
  void createdUsesCreatedStatus() {
    ResponseEntity<ApiResponse<String>> response = ApiResponses.created("id");

    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertEquals(201, response.getBody().status());
    assertEquals("id", response.getBody().data());
  }

  @Test
  void deletedHasNoData() {
    ResponseEntity<ApiResponse<Void>> response = ApiResponses.deleted();

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals("Ressource supprimee", response.getBody().message());
    assertNull(response.getBody().data());
  }

  @Test
  void errorKeepsCodeInData() {
    ResponseEntity<ApiResponse<String>> response =
        ApiResponses.error(HttpStatus.CONFLICT, "Deja existant", "email_already_used");

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    assertEquals(409, response.getBody().status());
    assertEquals("email_already_used", response.getBody().data());
  }
}
