package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cliente")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "documento_identidad")
    private String documentoIdentidad;

    @Column(name = "email")
    private String email;

    @Column(name = "pais")
    private String pais;

    @Column(name = "ciudad")
    private String ciudad;

    @Column(name = "canton")
    private String canton;

    @Column(name = "direccion", columnDefinition = "TEXT")
    private String direccion;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "clienteRemitente", cascade = CascadeType.ALL)
    private List<Paquete> paquetesRemitidos;

    @OneToMany(mappedBy = "clienteDestinatario", cascade = CascadeType.ALL)
    private List<Paquete> paquetesRecibidos;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Usuario> usuarios;
}

