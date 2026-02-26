package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.DespachoMasivoSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface DespachoMasivoSesionRepository extends JpaRepository<DespachoMasivoSesion, Long> {

    Optional<DespachoMasivoSesion> findByUsuarioIdUsuario(Long idUsuario);

    /** Upsert por id_usuario: inserta o actualiza payload y updated_at. */
    @Modifying
    @Query(value = "INSERT INTO despacho_masivo_sesion (id_usuario, payload, updated_at) VALUES (:idUsuario, :payload, :updatedAt) "
            + "ON CONFLICT (id_usuario) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at", nativeQuery = true)
    void upsertSesion(@Param("idUsuario") Long idUsuario, @Param("payload") String payload, @Param("updatedAt") LocalDateTime updatedAt);
}
