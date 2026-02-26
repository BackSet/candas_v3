package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "paquete_saca")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaqueteSaca {

    @EmbeddedId
    private PaqueteSacaId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idPaquete")
    @JoinColumn(name = "id_paquete")
    private Paquete paquete;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("idSaca")
    @JoinColumn(name = "id_saca")
    private Saca saca;

    @Column(name = "orden_en_saca")
    private Integer ordenEnSaca;
}
