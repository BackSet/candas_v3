package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "punto_origen")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuntoOrigen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_punto_origen")
    private Long idPuntoOrigen;

    @Column(name = "nombre_punto_origen", nullable = false)
    private String nombrePuntoOrigen;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "puntoOrigen", cascade = CascadeType.ALL)
    private List<Paquete> paquetes;
}
