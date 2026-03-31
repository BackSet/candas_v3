package com.candas.candas_backend.entity;

import com.candas.candas_backend.entity.enums.EstadoAtencion;
import com.candas.candas_backend.entity.enums.TipoProblemaAtencion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "atencion_paquete")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtencionPaquete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_atencion")
    private Long idAtencion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paquete", nullable = false)
    private Paquete paquete;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia_propietaria")
    private Agencia agenciaPropietaria;

    @Column(name = "motivo", nullable = false, columnDefinition = "TEXT")
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_problema", nullable = false, length = 50)
    private TipoProblemaAtencion tipoProblema;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoAtencion estado;

    @Column(name = "observaciones_resolucion", columnDefinition = "TEXT")
    private String observacionesResolucion;

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;
}

