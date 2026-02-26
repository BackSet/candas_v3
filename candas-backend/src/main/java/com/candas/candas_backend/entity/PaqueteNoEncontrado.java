package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "paquete_no_encontrado")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteNoEncontrado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paquete_no_encontrado")
    private Long idPaqueteNoEncontrado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote_recepcion", nullable = false)
    private LoteRecepcion loteRecepcion;

    @Column(name = "numero_guia", nullable = false, length = 100)
    private String numeroGuia;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "usuario_registro", nullable = false)
    private String usuarioRegistro;

    @PrePersist
    protected void onCreate() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }
}
