package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.EnsacadoSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EnsacadoSesionRepository extends JpaRepository<EnsacadoSesion, Long> {

    Optional<EnsacadoSesion> findByUsuarioIdUsuario(Long idUsuario);

    @Query("SELECT s FROM EnsacadoSesion s LEFT JOIN FETCH s.paquete WHERE s.idUsuario = :idUsuario")
    Optional<EnsacadoSesion> findByUsuarioIdUsuarioWithPaquete(@Param("idUsuario") Long idUsuario);

    /** Upsert por id_usuario: evita persist de entidad y el error "null identifier" con @MapsId. */
    @Modifying
    @Query(value = "INSERT INTO ensacado_sesion (id_usuario, id_paquete, updated_at) VALUES (:idUsuario, :idPaquete, :updatedAt) "
            + "ON CONFLICT (id_usuario) DO UPDATE SET id_paquete = EXCLUDED.id_paquete, updated_at = EXCLUDED.updated_at", nativeQuery = true)
    void upsertSesion(@Param("idUsuario") Long idUsuario, @Param("idPaquete") Long idPaquete, @Param("updatedAt") LocalDateTime updatedAt);
}
