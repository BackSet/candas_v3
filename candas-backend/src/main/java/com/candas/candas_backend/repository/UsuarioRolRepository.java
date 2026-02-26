package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.UsuarioRol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, Long> {
    List<UsuarioRol> findByUsuarioIdUsuario(Long idUsuario);
    List<UsuarioRol> findByUsuarioIdUsuarioAndActivoTrue(Long idUsuario);
    Optional<UsuarioRol> findByUsuarioIdUsuarioAndRolIdRol(Long idUsuario, Long idRol);
    boolean existsByUsuarioIdUsuarioAndRolIdRol(Long idUsuario, Long idRol);
}

