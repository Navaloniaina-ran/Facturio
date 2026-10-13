package fr.facturio.backend.creator.profile.dto;

import java.util.*;

public record CreatorProfileResponse(
    UUID id,
    String name,
    String handle,
    String email,
    String subProfile,
    List<String> platforms,
    String niche,
    String countryCode,
    String currency,
    boolean vatRegistered,
    String plan) {}
