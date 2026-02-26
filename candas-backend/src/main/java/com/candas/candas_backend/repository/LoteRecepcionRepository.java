package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.LoteRecepcion;
import com.candas.candas_backend.entity.enums.TipoLote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteRecepcionRepository extends JpaRepository<LoteRecepcion, Long>, JpaSpecificationExecutor<LoteRecepcion> {

    Page<LoteRecepcion> findByTipoLote(TipoLote tipoLote, Pageable pageable);
    
    @Query("SELECT COUNT(p) FROM Paquete p WHERE p.loteRecepcion.idLoteRecepcion = :idLoteRecepcion")
    Long countPaquetesByLoteRecepcion(@Param("idLoteRecepcion") Long idLoteRecepcion);
    
    @Query("SELECT COUNT(p) FROM Paquete p WHERE p.loteRecepcion.idLoteRecepcion = :idLoteRecepcion AND p.estado = 'DESPACHADO'")
    Long countPaquetesDespachadosByLoteRecepcion(@Param("idLoteRecepcion") Long idLoteRecepcion);
    
    @Query(value = "SELECT DISTINCT lr.id_lote_recepcion FROM lote_recepcion lr " +
           "WHERE (LOWER(COALESCE(lr.numero_recepcion, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(lr.usuario_registro, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    @Query(value = "SELECT DISTINCT lr.id_lote_recepcion FROM lote_recepcion lr " +
           "WHERE lr.tipo_lote = :tipoLote " +
           "AND (LOWER(COALESCE(lr.numero_recepcion, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(lr.usuario_registro, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIdsByTipoLote(@Param("query") String query, @Param("tipoLote") String tipoLote);

    @Query("SELECT lr FROM LoteRecepcion lr WHERE lr.idLoteRecepcion IN :ids")
    @EntityGraph(attributePaths = { "agencia" })
    List<LoteRecepcion> findAllByIdWithAgencia(@Param("ids") Iterable<Long> ids);
}
