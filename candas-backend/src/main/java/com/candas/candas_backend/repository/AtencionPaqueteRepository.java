package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.AtencionPaquete;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AtencionPaqueteRepository extends JpaRepository<AtencionPaquete, Long> {

    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    @Override
    java.util.Optional<AtencionPaquete> findById(Long id);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    @Override
    org.springframework.data.domain.Page<AtencionPaquete> findAll(org.springframework.data.domain.Pageable pageable);

    /** Lista paginada con filtros opcionales: estado y búsqueda en guía o motivo. {@code idAgencia} null = sin restricción por agencia. */
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    @Query("SELECT a FROM AtencionPaquete a LEFT JOIN a.paquete p "
            + "LEFT JOIN p.agenciaDestino ad "
            + "LEFT JOIN p.loteRecepcion lr "
            + "LEFT JOIN lr.agencia lra "
            + "WHERE (:estado IS NULL OR a.estado = :estado) AND "
            + "(:search IS NULL OR :search = '' OR "
            + "LOWER(COALESCE(a.motivo, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(COALESCE(p.numeroGuia, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND "
            + "(:idAgencia IS NULL OR "
            + "(ad IS NOT NULL AND ad.idAgencia = :idAgencia) OR "
            + "(lra IS NOT NULL AND lra.idAgencia = :idAgencia))")
    org.springframework.data.domain.Page<AtencionPaquete> findAllFiltered(
            @Param("estado") com.candas.candas_backend.entity.enums.EstadoAtencion estado,
            @Param("search") String search,
            @Param("idAgencia") Long idAgencia,
            org.springframework.data.domain.Pageable pageable);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    java.util.List<AtencionPaquete> findByPaqueteIdPaquete(Long idPaquete);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    java.util.List<AtencionPaquete> findByPaqueteIdPaqueteAndActivaTrue(Long idPaquete);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia"})
    @Query("SELECT a FROM AtencionPaquete a LEFT JOIN a.paquete p "
            + "LEFT JOIN p.agenciaDestino ad "
            + "LEFT JOIN p.loteRecepcion lr "
            + "LEFT JOIN lr.agencia lra "
            + "WHERE a.estado = :estado AND a.activa = true AND "
            + "(:idAgencia IS NULL OR "
            + "(ad IS NOT NULL AND ad.idAgencia = :idAgencia) OR "
            + "(lra IS NOT NULL AND lra.idAgencia = :idAgencia))")
    java.util.List<AtencionPaquete> findByEstadoAndActivaTrue(
            @Param("estado") com.candas.candas_backend.entity.enums.EstadoAtencion estado,
            @Param("idAgencia") Long idAgencia);
}

