package com.candas.candas_backend.dto;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SacaDTO {
    private Long idSaca;
    
    private String codigoQr; // Se genera automáticamente (ID de la saca)
    
    private Integer numeroOrden; // Se genera automáticamente
    
    @NotNull(message = "El tamaño es obligatorio")
    private TamanoSaca tamano;
    
    private BigDecimal pesoTotal;
    private Long idDespacho;
    private String numeroManifiesto; // Número de manifiesto del despacho para mostrar en listas
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEnsacado;
    
    private List<Long> idPaquetes; // Para asignar paquetes al crear la saca
}
