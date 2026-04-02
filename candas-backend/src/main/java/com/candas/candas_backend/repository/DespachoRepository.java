package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Despacho;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DespachoRepository extends JpaRepository<Despacho, Long>, JpaSpecificationExecutor<Despacho> {
    @Override
    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findAllByAgenciaIsNotNull(Pageable pageable);

    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findAllByDestinatarioDirectoIsNotNull(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Optional<Despacho> findById(Long id);
    
    @Query("SELECT d FROM Despacho d WHERE d.idDespacho = :id")
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Optional<Despacho> findByIdWithPaquetes(@Param("id") Long id);
    
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByAgencia_IdAgenciaAndFechaDespachoBetween(
        Long idAgencia, 
        LocalDateTime fechaInicio, 
        LocalDateTime fechaFin
    );

    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByAgenciaPropietaria_IdAgenciaAndFechaDespachoBetween(
        Long idAgenciaPropietaria,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
    );

    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByAgenciaPropietaria_IdAgenciaAndAgencia_IdAgenciaAndFechaDespachoBetween(
        Long idAgenciaPropietaria,
        Long idAgenciaDestino,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
    );
    
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByFechaDespachoBetween(
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
    );

    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findByFechaDespachoBetween(
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findByFechaDespachoBetweenAndAgenciaIsNotNull(
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        Pageable pageable
    );

    @EntityGraph(attributePaths = {"agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    Page<Despacho> findByFechaDespachoBetweenAndDestinatarioDirectoIsNotNull(
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        Pageable pageable
    );
    
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByDistribuidor_IdDistribuidorAndFechaDespachoBetween(
        Long idDistribuidor, 
        LocalDateTime fechaInicio, 
        LocalDateTime fechaFin
    );

    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findByAgenciaPropietaria_IdAgenciaAndDistribuidor_IdDistribuidorAndFechaDespachoBetween(
        Long idAgenciaPropietaria,
        Long idDistribuidor,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
    );
    
    @Query(value = "SELECT DISTINCT d.id_despacho FROM despacho d " +
           "LEFT JOIN usuario u ON u.id_usuario = d.id_usuario_registro " +
           "WHERE (LOWER(COALESCE(d.numero_manifiesto, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(u.nombre_completo, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    @Query("SELECT d FROM Despacho d WHERE d.idDespacho IN :ids")
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    List<Despacho> findAllByIdWithRelations(@Param("ids") Iterable<Long> ids);
    
    // Consultas para ensacado - Despachos con paquetes pendientes (en progreso) por periodo
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query(value = "SELECT DISTINCT d FROM Despacho d " +
           "JOIN d.sacas s " +
           "JOIN s.paqueteSacas ps " +
           "JOIN ps.paquete p " +
           "WHERE p.estado != 'ENSACADO' " +
           "AND d.fechaDespacho >= :fechaInicio AND d.fechaDespacho <= :fechaFin " +
           "ORDER BY d.fechaDespacho DESC")
    List<Despacho> findDespachosConPaquetesPendientesEntre(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin);

    // Consultas para ensacado - Despachos completamente ensacados
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query(value = "SELECT DISTINCT d FROM Despacho d " +
           "WHERE d.idDespacho NOT IN (" +
           "  SELECT DISTINCT d2.idDespacho FROM Despacho d2 " +
           "  JOIN d2.sacas s2 " +
           "  JOIN s2.paqueteSacas ps2 " +
           "  JOIN ps2.paquete p2 " +
           "  WHERE p2.estado != 'ENSACADO'" +
           ") " +
           "AND d.fechaDespacho >= :fechaInicio " +
           "ORDER BY d.fechaDespacho DESC")
    List<Despacho> findDespachosCompletamenteEnsacados(@Param("fechaInicio") LocalDateTime fechaInicio);
    
    // Consultas para manifiestos consolidados - Despachos por destinatario directo
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query("SELECT d FROM Despacho d WHERE d.destinatarioDirecto.idDestinatarioDirecto = :idDestinatarioDirecto AND d.fechaDespacho BETWEEN :inicio AND :fin")
    List<Despacho> findByDestinatarioDirecto_IdDestinatarioDirectoAndFechaDespachoBetween(
        @Param("idDestinatarioDirecto") Long idDestinatarioDirecto,
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );

    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query("""
           SELECT d FROM Despacho d
           WHERE d.agenciaPropietaria.idAgencia = :idAgenciaPropietaria
             AND d.destinatarioDirecto.idDestinatarioDirecto = :idDestinatarioDirecto
             AND d.fechaDespacho BETWEEN :inicio AND :fin
           """)
    List<Despacho> findByAgenciaPropietaria_IdAgenciaAndDestinatarioDirecto_IdDestinatarioDirectoAndFechaDespachoBetween(
        @Param("idAgenciaPropietaria") Long idAgenciaPropietaria,
        @Param("idDestinatarioDirecto") Long idDestinatarioDirecto,
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );
    
    // Consultas para manifiestos consolidados - Todos los despachos de destinatarios directos en un rango
    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query("SELECT d FROM Despacho d WHERE d.destinatarioDirecto IS NOT NULL AND d.fechaDespacho BETWEEN :inicio AND :fin")
    List<Despacho> findByDestinatarioDirectoIsNotNullAndFechaDespachoBetween(
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );

    @EntityGraph(attributePaths = {"sacas", "agencia", "agenciaPropietaria", "distribuidor", "destinatarioDirecto", "usuarioRegistro"})
    @Query("""
           SELECT d FROM Despacho d
           WHERE d.agenciaPropietaria.idAgencia = :idAgenciaPropietaria
             AND d.destinatarioDirecto IS NOT NULL
             AND d.fechaDespacho BETWEEN :inicio AND :fin
           """)
    List<Despacho> findByAgenciaPropietaria_IdAgenciaAndDestinatarioDirectoIsNotNullAndFechaDespachoBetween(
        @Param("idAgenciaPropietaria") Long idAgenciaPropietaria,
        @Param("inicio") LocalDateTime inicio,
        @Param("fin") LocalDateTime fin
    );
}

