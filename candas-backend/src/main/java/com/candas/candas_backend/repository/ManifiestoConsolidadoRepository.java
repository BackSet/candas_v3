package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.ManifiestoConsolidado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ManifiestoConsolidadoRepository extends JpaRepository<ManifiestoConsolidado, Long>, JpaSpecificationExecutor<ManifiestoConsolidado> {

    @EntityGraph(attributePaths = { "agencia" })
    Page<ManifiestoConsolidado> findAllByOrderByFechaGeneracionDesc(Pageable pageable);

    @EntityGraph(attributePaths = { "agencia" })
    List<ManifiestoConsolidado> findByAgencia_IdAgenciaOrderByFechaGeneracionDesc(Long idAgencia);

    @EntityGraph(attributePaths = { "agencia" })
    Page<ManifiestoConsolidado> findByAgencia_IdAgenciaOrderByFechaGeneracionDesc(Long idAgencia, Pageable pageable);

    @EntityGraph(attributePaths = { "agencia" })
    Page<ManifiestoConsolidado> findByFechaGeneracionBetweenOrderByFechaGeneracionDesc(
            LocalDateTime inicio,
            LocalDateTime fin,
            Pageable pageable);

    @Query(value = "SELECT DISTINCT mc.id_manifiesto_consolidado FROM manifiesto_consolidado mc " +
            "LEFT JOIN agencia a ON a.id_agencia = mc.id_agencia " +
            "WHERE (LOWER(COALESCE(mc.numero_manifiesto, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(a.nombre, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(mc.periodo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(mc.usuario_generador, '')) LIKE LOWER(CONCAT('%', :query, '%')))", nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    @Query("SELECT mc FROM ManifiestoConsolidado mc WHERE mc.idManifiestoConsolidado IN :ids")
    @EntityGraph(attributePaths = { "agencia" })
    List<ManifiestoConsolidado> findAllByIdWithAgencia(@Param("ids") Iterable<Long> ids);

    @Query(value = "SELECT MAX(numero_manifiesto) FROM manifiesto_consolidado WHERE numero_manifiesto LIKE 'MCF-%'", nativeQuery = true)
    String findMaxNumeroManifiesto();

    boolean existsByNumeroManifiesto(String numeroManifiesto);
}
