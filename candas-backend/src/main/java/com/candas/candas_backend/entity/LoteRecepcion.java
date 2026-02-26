package com.candas.candas_backend.entity;

import com.candas.candas_backend.entity.enums.TipoLote;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "lote_recepcion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteRecepcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote_recepcion")
    private Long idLoteRecepcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_lote", nullable = false, length = 20)
    private TipoLote tipoLote = TipoLote.NORMAL;

    @Column(name = "numero_recepcion", unique = true, nullable = false)
    private String numeroRecepcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia", nullable = false)
    private Agencia agencia;

    @Column(name = "fecha_recepcion", nullable = false)
    private LocalDateTime fechaRecepcion;

    @Column(name = "usuario_registro", nullable = false)
    private String usuarioRegistro;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @OneToMany(mappedBy = "loteRecepcion", cascade = {})
    private List<Paquete> paquetes;
}
