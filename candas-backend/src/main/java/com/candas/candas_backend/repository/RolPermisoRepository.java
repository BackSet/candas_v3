package com.candas.candas_backend.repository;

import com.candas.candas_backend.entity.RolPermiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolPermisoRepository extends JpaRepository<RolPermiso, Long> {
    List<RolPermiso> findByRolIdRol(Long idRol);
    Optional<RolPermiso> findByRolIdRolAndPermisoIdPermiso(Long idRol, Long idPermiso);
    boolean existsByRolIdRolAndPermisoIdPermiso(Long idRol, Long idPermiso);
}

