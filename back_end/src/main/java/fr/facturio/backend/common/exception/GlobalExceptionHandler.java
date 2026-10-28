package fr.facturio.backend.common.exception;

import fr.facturio.backend.common.dto.ApiResponse;
import fr.facturio.backend.common.util.ApiResponses;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ApiException.class)
  ResponseEntity<ApiResponse<Map<String, String>>> handleApiException(ApiException exception) {
    return error(exception.status(), exception.getMessage(), exception.code());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
      MethodArgumentNotValidException exception) {
    String message =
        exception.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .orElse("Requete invalide");
    return error(HttpStatus.BAD_REQUEST, message, "validation_error");
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiResponse<Map<String, String>>> handleUnreadableBody(
      HttpMessageNotReadableException exception) {
    return error(HttpStatus.BAD_REQUEST, "Corps de requete illisible", "malformed_body");
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  ResponseEntity<ApiResponse<Map<String, String>>> handleMethodNotSupported(
      HttpRequestMethodNotSupportedException exception) {
    return error(
        HttpStatus.METHOD_NOT_ALLOWED, "Methode HTTP non autorisee", "method_not_allowed");
  }

  @ExceptionHandler(NoResourceFoundException.class)
  ResponseEntity<ApiResponse<Map<String, String>>> handleNotFound(
      NoResourceFoundException exception) {
    return error(HttpStatus.NOT_FOUND, "Ressource introuvable", "not_found");
  }

  /** Les erreurs gardent leur code metier dans {@code data.code}, comme avant. */
  private static ResponseEntity<ApiResponse<Map<String, String>>> error(
      HttpStatus status, String message, String code) {
    return ApiResponses.error(status, message, Map.of("code", code));
  }
}
