package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "distribuidor")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Distribuidor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_distribuidor")
    private Long idDistribuidor;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "codigo", unique = true)
    private String codigo;

    @Column(name = "email")
    private String email;

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    @OneToMany(mappedBy = "distribuidor", cascade = CascadeType.ALL)
    private List<Despacho> despachos;
}
