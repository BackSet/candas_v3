package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "agencia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Agencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_agencia")
    private Long idAgencia;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "codigo", unique = true)
    private String codigo;

    @Column(name = "direccion")
    private String direccion;

    @Column(name = "email")
    private String email;

    @Column(name = "canton")
    private String canton;

    @Column(name = "nombre_personal")
    private String nombrePersonal;

    @Column(name = "horario_atencion")
    private String horarioAtencion;

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    @OneToMany(mappedBy = "agencia", cascade = CascadeType.ALL)
    private List<LoteRecepcion> recepciones;

    @OneToMany(mappedBy = "agenciaDestino", cascade = CascadeType.ALL)
    private List<Paquete> paquetesDestino;

    @OneToMany(mappedBy = "agencia", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TelefonoAgencia> telefonos;
}

