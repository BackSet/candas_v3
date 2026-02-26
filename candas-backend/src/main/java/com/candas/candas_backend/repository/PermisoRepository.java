package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    Optional<Permiso> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
    
    @Query(value = "SELECT DISTINCT p.id_permiso FROM permiso p " +
           "WHERE (LOWER(COALESCE(p.nombre, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(p.descripcion, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(p.recurso, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(p.accion, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);
}

