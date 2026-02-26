package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TipoPaquete;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarTipoMasivoDTO {
    @NotEmpty(message = "La lista de IDs no puede estar vacía")
    private List<Long> ids;
    
    @NotNull(message = "El tipo de paquete es requerido")
    private TipoPaquete nuevoTipo;
}
