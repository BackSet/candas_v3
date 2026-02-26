package com.candas.candas_backend.entity;

import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.entity.enums.TipoDestino;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "paquete", 
       uniqueConstraints = @UniqueConstraint(
           name = "uk_paquete_numero_guia", 
           columnNames = "numero_guia"
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paquete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paquete")
    private Long idPaquete;

    @Column(name = "numero_guia", unique = true)
    private String numeroGuia;

    @Column(name = "numero_master")
    private String numeroMaster;

    @Column(name = "peso_kilos", precision = 10, scale = 2)
    private BigDecimal pesoKilos;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPaquete estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_paquete", length = 20)
    private TipoPaquete tipoPaquete;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_destino", length = 20)
    private TipoDestino tipoDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_punto_origen")
    private PuntoOrigen puntoOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente_remitente", nullable = false)
    private Cliente clienteRemitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente_destinatario")
    private Cliente clienteDestinatario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia_destino")
    private Agencia agenciaDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_destinatario_directo")
    private DestinatarioDirecto destinatarioDirecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote_recepcion")
    private LoteRecepcion loteRecepcion;

    @OneToMany(mappedBy = "paquete", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaqueteSaca> paqueteSacas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paquete_padre")
    private Paquete paquetePadre;

    @OneToMany(mappedBy = "paquetePadre", cascade = CascadeType.ALL)
    private List<Paquete> paquetesHijos;

    @Column(name = "etiqueta_destinatario")
    private String etiquetaDestinatario;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_recepcion")
    private LocalDateTime fechaRecepcion;

    @Column(name = "fecha_ensacado")
    private LocalDateTime fechaEnsacado;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "sed")
    private String sed;

    @Column(name = "medidas")
    private String medidas;

    @Column(name = "peso_libras", precision = 10, scale = 2)
    private BigDecimal pesoLibras;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "valor", precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "tarifa_position")
    private String tarifaPosition;

    @Column(name = "ref")
    private String ref;

    @Column(name = "etiqueta_cambiada")
    private Boolean etiquetaCambiada;

    @Column(name = "separado")
    private Boolean separado;

    @Column(name = "unido_en_caja")
    private Boolean unidoEnCaja;

    @Column(name = "fecha_etiqueta_cambiada")
    private LocalDateTime fechaEtiquetaCambiada;

    @Column(name = "fecha_separado")
    private LocalDateTime fechaSeparado;

    @Column(name = "fecha_unido_en_caja")
    private LocalDateTime fechaUnidoEnCaja;

    @OneToMany(mappedBy = "paquete", cascade = CascadeType.ALL)
    private List<AtencionPaquete> atenciones;
}

