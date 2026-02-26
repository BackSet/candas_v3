package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long>, JpaSpecificationExecutor<Usuario> {
    @EntityGraph(attributePaths = {
            "usuarioRoles", "usuarioRoles.rol", "agencia"
    })
    Optional<Usuario> findByUsername(String username);
    
    Optional<Usuario> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    @EntityGraph(attributePaths = {
            "usuarioRoles", "usuarioRoles.rol"
    })
    Page<Usuario> findAll(Pageable pageable);
    
    @EntityGraph(attributePaths = {
            "usuarioRoles", "usuarioRoles.rol"
    })
    List<Usuario> findAllById(Iterable<Long> ids);
    
    @Query(value = "SELECT DISTINCT u.id_usuario FROM usuario u " +
           "LEFT JOIN cliente c ON c.id_cliente = u.id_cliente " +
           "WHERE (LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(u.nombre_completo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.nombre_completo, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(c.documento_identidad, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
           nativeQuery = true)
    List<Long> searchIds(@Param("query") String query);

    @Query(value = """
            SELECT DISTINCT r.nombre
            FROM usuario u
            JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.activo = TRUE
            JOIN rol r ON r.id_rol = ur.id_rol AND r.activo = TRUE
            WHERE u.username = :username
            """, nativeQuery = true)
    List<String> findActiveRoleNamesByUsername(@Param("username") String username);

    @Query(value = """
            SELECT DISTINCT p.nombre
            FROM usuario u
            JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario AND ur.activo = TRUE
            JOIN rol r ON r.id_rol = ur.id_rol AND r.activo = TRUE
            JOIN rol_permiso rp ON rp.id_rol = r.id_rol
            JOIN permiso p ON p.id_permiso = rp.id_permiso
            WHERE u.username = :username
            """, nativeQuery = true)
    List<String> findActivePermissionNamesByUsername(@Param("username") String username);
}

