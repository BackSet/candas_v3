package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "manifiesto_consolidado")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManifiestoConsolidado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_manifiesto_consolidado")
    private Long idManifiestoConsolidado;

    @Column(name = "numero_manifiesto", unique = true)
    private String numeroManifiesto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia", nullable = true)
    private Agencia agencia;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "mes")
    private Integer mes;

    @Column(name = "anio")
    private Integer anio;

    @Column(name = "fecha_generacion", nullable = false)
    private LocalDateTime fechaGeneracion;

    @Column(name = "usuario_generador", nullable = false, length = 255)
    private String usuarioGenerador;

    @Column(name = "total_despachos")
    private Integer totalDespachos = 0;

    @Column(name = "total_sacas")
    private Integer totalSacas = 0;

    @Column(name = "total_paquetes")
    private Integer totalPaquetes = 0;

    @Column(name = "peso_total", precision = 10, scale = 2)
    private BigDecimal pesoTotal;
}
