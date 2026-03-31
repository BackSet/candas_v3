package com.candas.candas_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteRecepcionDTO {
    private Long idLoteRecepcion;
    /** NORMAL o ESPECIAL; por defecto NORMAL */
    private String tipoLote;
    private String numeroRecepcion;
    
    /** Opcional al crear: si es null se usa la agencia del usuario autenticado */
    private Long idAgencia;
    
    private String nombreAgencia; // Nombre de la agencia para mostrar en listas
    private String cantonAgencia; // Cantón de la agencia para mostrar en listas
    
    @NotNull(message = "La fecha de recepción es obligatoria")
    private LocalDateTime fechaRecepcion;
    
    private String usuarioRegistro;
    
    private String observaciones;
    
    // Campos calculados dinámicamente
    private BigDecimal porcentajeCompletado;
    private Integer totalPaquetes;
    private Integer paquetesDespachados;
    private Integer paquetesPendientes;
}
