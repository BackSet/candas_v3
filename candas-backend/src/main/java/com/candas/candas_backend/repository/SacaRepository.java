package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Saca;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SacaRepository extends JpaRepository<Saca, Long>, JpaSpecificationExecutor<Saca> {
    @Query(value = "SELECT DISTINCT s.id_saca FROM saca s " +
           "WHERE (LOWER(COALESCE(s.codigo_qr, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR CAST(s.id_saca AS TEXT) LIKE CONCAT('%', :query, '%'))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    @Query("SELECT s FROM Saca s WHERE s.idSaca IN :ids")
    @EntityGraph(attributePaths = { "despacho" })
    List<Saca> findAllByIdWithDespacho(@Param("ids") Iterable<Long> ids);
    
    @EntityGraph(attributePaths = {"paqueteSacas", "paqueteSacas.paquete"})
    List<Saca> findByDespachoIdDespacho(Long idDespacho);
    
    @Modifying(clearAutomatically = true)
    @Query(value = "DELETE FROM saca WHERE id_despacho = :idDespacho", nativeQuery = true)
    void deleteByDespachoIdDespacho(@Param("idDespacho") Long idDespacho);
}

