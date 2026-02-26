package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "telefono_agencia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelefonoAgencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_telefono")
    private Long idTelefono;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia", nullable = false)
    private Agencia agencia;

    @Column(name = "numero", nullable = false)
    private String numero;

    @Column(name = "principal", nullable = false)
    private Boolean principal = false;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;
}
