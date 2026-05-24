package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Único campo editable vía API/UI. Recurso, acción y descripción se gestionan en código (DataInitializer).
 */
public record PermisoNombreUpdateDTO(
    @NotBlank(message = "El nombre del permiso es obligatorio")
    String nombre
) {}
