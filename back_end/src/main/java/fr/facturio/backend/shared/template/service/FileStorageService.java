package fr.facturio.backend.shared.template.service;

import fr.facturio.backend.common.exception.ApiException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
  private static final Set<String> IMAGE_TYPES =
      Set.of("image/png", "image/jpeg", "image/webp", "image/svg+xml");
  private final Path storage;

  public FileStorageService(@Value("${facturio.storage-path:./uploads}") String storagePath) {
    storage = Path.of(storagePath).toAbsolutePath().normalize();
  }

  public String storeLogo(MultipartFile file) throws IOException {
    if (file.isEmpty() || file.getSize() > 1_000_000) {
      throw ApiException.badRequest("invalid_logo_size", "Le logo doit peser moins de 1 Mo");
    }
    if (!IMAGE_TYPES.contains(file.getContentType())) {
      throw ApiException.badRequest("invalid_logo_type", "Format de logo non accepte");
    }
    Files.createDirectories(storage);
    String extension =
        switch (Objects.requireNonNull(file.getContentType())) {
          case "image/png" -> ".png";
          case "image/jpeg" -> ".jpg";
          case "image/webp" -> ".webp";
          default -> ".svg";
        };
    String name = UUID.randomUUID() + extension;
    Path target = resolve(name);
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return name;
  }

  public Resource load(String name) {
    Path target = resolve(name);
    if (!Files.isRegularFile(target)) throw ApiException.notFound("Fichier");
    return new FileSystemResource(target);
  }

  public MediaType mediaType(String name) throws IOException {
    String type = Files.probeContentType(resolve(name));
    return type == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(type);
  }

  private Path resolve(String name) {
    Path target = storage.resolve(name).normalize();
    if (!target.startsWith(storage)) {
      throw ApiException.badRequest("invalid_file", "Nom de fichier invalide");
    }
    return target;
  }
}
