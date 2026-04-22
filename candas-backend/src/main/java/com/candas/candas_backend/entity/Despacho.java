package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.BatchSize;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "despacho")
@BatchSize(size = 32)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Despacho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_despacho")
    private Long idDespacho;

    @Column(name = "numero_manifiesto", unique = true)
    private String numeroManifiesto;

    @Column(name = "fecha_despacho", nullable = false)
    private LocalDateTime fechaDespacho;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_registro")
    private Usuario usuarioRegistro;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia")
    private Agencia agencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia_propietaria")
    private Agencia agenciaPropietaria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_distribuidor")
    private Distribuidor distribuidor;

    @Column(name = "numero_guia_agencia_distribucion")
    private String numeroGuiaAgenciaDistribucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_destinatario_directo")
    private DestinatarioDirecto destinatarioDirecto;

    @Column(name = "codigo_presinto", length = 64)
    private String codigoPresinto;

    @OneToMany(mappedBy = "despacho", cascade = CascadeType.ALL)
    private List<Saca> sacas;
}

