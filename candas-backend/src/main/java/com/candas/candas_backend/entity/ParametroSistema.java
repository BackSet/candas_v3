package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "parametro_sistema",
       uniqueConstraints = @UniqueConstraint(name = "uk_parametro_sistema_clave", columnNames = "clave"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParametroSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_parametro_sistema")
    private Long idParametroSistema;

    @Column(name = "clave", nullable = false, unique = true, length = 100)
    private String clave;

    @Column(name = "valor", columnDefinition = "TEXT")
    private String valor;
}
