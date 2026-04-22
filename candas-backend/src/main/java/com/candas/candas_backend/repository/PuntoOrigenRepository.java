package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.PuntoOrigen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PuntoOrigenRepository extends JpaRepository<PuntoOrigen, Long>, JpaSpecificationExecutor<PuntoOrigen> {
    @Query(value = "SELECT DISTINCT po.id_punto_origen FROM punto_origen po " +
           "WHERE LOWER(COALESCE(po.nombre_punto_origen, '')) LIKE LOWER(CONCAT('%', :query, '%'))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);
}
