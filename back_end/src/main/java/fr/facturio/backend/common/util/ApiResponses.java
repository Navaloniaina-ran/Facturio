package fr.facturio.backend.common.util;

import fr.facturio.backend.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** Fabriques reutilisables pour produire les reponses {@code { status, message, data }}. */
public final class ApiResponses {
  private static final String OK_MESSAGE = "Operation reussie";
  private static final String CREATED_MESSAGE = "Ressource creee";
  private static final String DELETED_MESSAGE = "Ressource supprimee";

  private ApiResponses() {}

  public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
    return ok(data, OK_MESSAGE);
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok(T data, String message) {
    return of(HttpStatus.OK, message, data);
  }

  public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
    return of(HttpStatus.CREATED, CREATED_MESSAGE, data);
  }

  public static ResponseEntity<ApiResponse<Void>> deleted() {
    return of(HttpStatus.OK, DELETED_MESSAGE, null);
  }

  public static <T> ResponseEntity<ApiResponse<T>> of(HttpStatus status, String message, T data) {
    return ResponseEntity.status(status).body(new ApiResponse<>(status.value(), message, data));
  }

  public static <T> ResponseEntity<ApiResponse<T>> error(
      HttpStatus status, String message, T data) {
    return of(status, message, data);
  }
}
