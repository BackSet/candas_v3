package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.DestinatarioDirecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinatarioDirectoRepository extends JpaRepository<DestinatarioDirecto, Long>, JpaSpecificationExecutor<DestinatarioDirecto> {

    List<DestinatarioDirecto> findByActivoTrue();

    @Query(value = "SELECT * FROM destinatario_directo d " +
            "WHERE d.activo = true AND (" +
            "LOWER(COALESCE(d.nombre_destinatario, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.telefono_destinatario, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.direccion_destinatario, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.canton, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.provincia, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.codigo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(d.nombre_empresa, '')) LIKE LOWER(CONCAT('%', :query, '%')))", nativeQuery = true)
    List<DestinatarioDirecto> search(@Param("query") String query);

    Optional<DestinatarioDirecto> findByTelefonoDestinatarioAndActivoTrue(String telefono);
}
