package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.EstadoAtencion;
import com.candas.candas_backend.entity.enums.TipoProblemaAtencion;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtencionPaqueteDTO {
    private Long idAtencion;
    
    @NotNull(message = "El paquete es obligatorio")
    private Long idPaquete;
    
    private String numeroGuia; // Número de guía del paquete para mostrar en listas
    
    @NotNull(message = "El motivo es obligatorio")
    private String motivo;
    
    @NotNull(message = "El tipo de problema es obligatorio")
    private TipoProblemaAtencion tipoProblema;
    
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaResolucion;
    
    @NotNull(message = "El estado es obligatorio")
    private EstadoAtencion estado;
    
    private String observacionesResolucion;
    private Boolean activa;
}
