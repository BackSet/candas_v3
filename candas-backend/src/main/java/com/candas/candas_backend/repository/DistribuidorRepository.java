package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Distribuidor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistribuidorRepository extends JpaRepository<Distribuidor, Long>, JpaSpecificationExecutor<Distribuidor> {
    Optional<Distribuidor> findByNombreIgnoreCase(String nombre);
    Optional<Distribuidor> findByCodigoIgnoreCase(String codigo);
    
    @Query(value = "SELECT DISTINCT d.id_distribuidor FROM distribuidor d " +
           "WHERE (LOWER(COALESCE(d.nombre, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(d.codigo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(d.email, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);
}
