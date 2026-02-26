package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Agencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgenciaRepository extends JpaRepository<Agencia, Long>, JpaSpecificationExecutor<Agencia> {
    @Query(value = "SELECT DISTINCT a.id_agencia FROM agencia a " +
            "LEFT JOIN telefono_agencia ta ON ta.id_agencia = a.id_agencia " +
            "WHERE (LOWER(COALESCE(a.nombre, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(a.codigo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(a.email, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(a.canton, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(COALESCE(ta.numero, '')) LIKE LOWER(CONCAT('%', :query, '%')))", nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    boolean existsByCodigo(String codigo);

    @Query("SELECT a FROM Agencia a WHERE a.codigo IS NULL OR a.codigo = ''")
    List<Agencia> findAgenciasSinCodigo();
}
