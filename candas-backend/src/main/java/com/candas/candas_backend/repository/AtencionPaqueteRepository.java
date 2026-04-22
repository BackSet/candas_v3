package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.AtencionPaquete;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AtencionPaqueteRepository extends JpaRepository<AtencionPaquete, Long> {

    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    @Override
    java.util.Optional<AtencionPaquete> findById(Long id);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    @Override
    org.springframework.data.domain.Page<AtencionPaquete> findAll(org.springframework.data.domain.Pageable pageable);

    /** Lista paginada con filtros opcionales: estado, búsqueda en guía o motivo, tipoProblema, rango de fechaSolicitud. {@code idAgencia} null = sin restricción por agencia. */
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    @Query("SELECT a FROM AtencionPaquete a LEFT JOIN a.paquete p "
            + "WHERE (:estado IS NULL OR a.estado = :estado) AND "
            + "(:search IS NULL OR :search = '' OR "
            + "LOWER(COALESCE(a.motivo, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(COALESCE(p.numeroGuia, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND "
            + "(:tipoProblema IS NULL OR a.tipoProblema = :tipoProblema) AND "
            + "(CAST(:fechaDesde AS timestamp) IS NULL OR a.fechaSolicitud >= :fechaDesde) AND "
            + "(CAST(:fechaHasta AS timestamp) IS NULL OR a.fechaSolicitud <= :fechaHasta) AND "
            + "(:idAgencia IS NULL OR (a.agenciaPropietaria IS NOT NULL AND a.agenciaPropietaria.idAgencia = :idAgencia))")
    org.springframework.data.domain.Page<AtencionPaquete> findAllFiltered(
            @Param("estado") com.candas.candas_backend.entity.enums.EstadoAtencion estado,
            @Param("search") String search,
            @Param("tipoProblema") com.candas.candas_backend.entity.enums.TipoProblemaAtencion tipoProblema,
            @Param("fechaDesde") java.time.LocalDateTime fechaDesde,
            @Param("fechaHasta") java.time.LocalDateTime fechaHasta,
            @Param("idAgencia") Long idAgencia,
            org.springframework.data.domain.Pageable pageable);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    java.util.List<AtencionPaquete> findByPaqueteIdPaquete(Long idPaquete);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    java.util.List<AtencionPaquete> findByPaqueteIdPaqueteAndActivaTrue(Long idPaquete);
    
    @EntityGraph(attributePaths = {"paquete", "paquete.agenciaDestino", "paquete.loteRecepcion", "paquete.loteRecepcion.agencia", "agenciaPropietaria"})
    @Query("SELECT a FROM AtencionPaquete a "
            + "WHERE a.estado = :estado AND a.activa = true AND "
            + "(:idAgencia IS NULL OR (a.agenciaPropietaria IS NOT NULL AND a.agenciaPropietaria.idAgencia = :idAgencia))")
    java.util.List<AtencionPaquete> findByEstadoAndActivaTrue(
            @Param("estado") com.candas.candas_backend.entity.enums.EstadoAtencion estado,
            @Param("idAgencia") Long idAgencia);
}

