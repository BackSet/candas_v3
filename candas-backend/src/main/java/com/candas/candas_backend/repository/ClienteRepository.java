package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long>, JpaSpecificationExecutor<Cliente> {
    Optional<Cliente> findById(Long id);
    
    Page<Cliente> findAll(Pageable pageable);
    
    List<Cliente> findAllById(Iterable<Long> ids);
    
    @Query(value = "SELECT DISTINCT c.id_cliente FROM cliente c " +
           "WHERE c.activo = true " +
           "AND (LOWER(COALESCE(c.nombre_completo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.documento_identidad, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.telefono, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.direccion, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.provincia, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.canton, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.pais, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);
    
    /**
     * Busca el primer cliente activo por id asc.
     * Se usa como cliente por defecto en flujos donde no se especifica.
     */
    Optional<Cliente> findFirstByActivoTrueOrderByIdClienteAsc();
}

