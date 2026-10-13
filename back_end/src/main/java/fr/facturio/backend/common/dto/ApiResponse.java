package fr.facturio.backend.common.dto;

/**
 * Enveloppe commune de toutes les reponses des controllers : {@code { status, message, data }}.
 *
 * @param status code HTTP de la reponse
 * @param message message lisible destine a l'utilisateur
 * @param data charge utile, {@code null} lorsqu'il n'y a rien a renvoyer
 */
public record ApiResponse<T>(int status, String message, T data) {}
