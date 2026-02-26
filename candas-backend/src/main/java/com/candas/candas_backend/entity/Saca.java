package com.candas.candas_backend.entity;

import com.candas.candas_backend.entity.enums.TamanoSaca;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "saca")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Saca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_saca")
    private Long idSaca;

    @Column(name = "codigo_qr", unique = true)
    private String codigoQr;

    @Column(name = "numero_orden", nullable = false)
    private Integer numeroOrden;

    @Enumerated(EnumType.STRING)
    @Column(name = "tamano", nullable = false)
    private TamanoSaca tamano;

    @Column(name = "peso_total", precision = 10, scale = 2)
    private BigDecimal pesoTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_despacho")
    private Despacho despacho;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_ensacado")
    private LocalDateTime fechaEnsacado;

    @OneToMany(mappedBy = "saca", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaqueteSaca> paqueteSacas;
}

