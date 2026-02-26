package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "destinatario_directo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DestinatarioDirecto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_destinatario_directo")
    private Long idDestinatarioDirecto;

    @Column(name = "nombre_destinatario", nullable = false)
    private String nombreDestinatario;

    @Column(name = "telefono_destinatario", nullable = false)
    private String telefonoDestinatario;

    @Column(name = "direccion_destinatario", columnDefinition = "TEXT")
    private String direccionDestinatario;

    @Column(name = "canton")
    private String canton;

    @Column(name = "codigo")
    private String codigo;

    @Column(name = "nombre_empresa")
    private String nombreEmpresa;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "destinatarioDirecto", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Despacho> despachos;
}
