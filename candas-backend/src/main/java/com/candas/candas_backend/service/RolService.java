package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.RolDTO;
import com.candas.candas_backend.entity.Rol;
import com.candas.candas_backend.entity.RolPermiso;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.PermisoRepository;
import com.candas.candas_backend.repository.RolPermisoRepository;
import com.candas.candas_backend.repository.RolRepository;
import com.candas.candas_backend.repository.spec.RolSpecs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RolService {

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;

    public RolService(
            RolRepository rolRepository,
            PermisoRepository permisoRepository,
            RolPermisoRepository rolPermisoRepository) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
    }

    public Page<RolDTO> findAll(Pageable pageable) {
        return findAll(pageable, null, null);
    }

    public Page<RolDTO> findAll(Pageable pageable, String search, Boolean activo) {
        boolean sinFiltros = (search == null || search.isBlank()) && activo == null;
        if (sinFiltros) {
            return rolRepository.findAll(pageable).map(this::toDTO);
        }
        return rolRepository.findAll(RolSpecs.withFilters(search, activo), pageable).map(this::toDTO);
    }

    public RolDTO findById(Long id) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rol", id));
        return toDTO(rol);
    }

    public List<RolDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = rolRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return rolRepository.findAllById(ids).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public RolDTO create(RolDTO dto) {
        Rol rol = toEntity(dto);
        rol.setFechaCreacion(LocalDateTime.now());
        rol.setActivo(true);
        
        Rol saved = rolRepository.save(rol);
        
        // Asignar permisos si se proporcionan
        if (dto.getPermisos() != null && !dto.getPermisos().isEmpty()) {
            asignarPermisos(saved.getIdRol(), dto.getPermisos());
        }
        
        return toDTO(saved);
    }

    public RolDTO update(Long id, RolDTO dto) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rol", id));
        
        rol.setNombre(dto.getNombre());
        rol.setDescripcion(dto.getDescripcion());
        if (dto.getActivo() != null) {
            rol.setActivo(dto.getActivo());
        }
        
        return toDTO(rolRepository.save(rol));
    }

    public void delete(Long id) {
        Rol rol = rolRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rol", id));
        rolRepository.delete(rol);
    }

    public void asignarPermisos(Long idRol, List<Long> idPermisos) {
        Rol rol = rolRepository.findById(idRol)
            .orElseThrow(() -> new ResourceNotFoundException("Rol", idRol));

        List<Long> ids = idPermisos != null ? idPermisos : Collections.emptyList();

        // Eliminar permisos actuales y hacer flush para evitar violación de uk_rol_permiso al insertar
        rolPermisoRepository.findByRolIdRol(idRol).forEach(rolPermisoRepository::delete);
        rolPermisoRepository.flush();

        // Asignar nuevos permisos
        for (Long idPermiso : ids) {
            var permiso = permisoRepository.findById(idPermiso)
                .orElseThrow(() -> new ResourceNotFoundException("Permiso", idPermiso));
            
            RolPermiso rolPermiso = new RolPermiso();
            rolPermiso.setRol(rol);
            rolPermiso.setPermiso(permiso);
            rolPermiso.setFechaAsignacion(LocalDateTime.now());
            rolPermisoRepository.save(rolPermiso);
        }
    }

    public List<Long> obtenerPermisos(Long idRol) {
        return rolPermisoRepository.findByRolIdRol(idRol)
            .stream()
            .map(rp -> rp.getPermiso().getIdPermiso())
            .collect(Collectors.toList());
    }

    private RolDTO toDTO(Rol rol) {
        RolDTO dto = new RolDTO();
        dto.setIdRol(rol.getIdRol());
        dto.setNombre(rol.getNombre());
        dto.setDescripcion(rol.getDescripcion());
        dto.setActivo(rol.getActivo());
        dto.setFechaCreacion(rol.getFechaCreacion());
        dto.setPermisos(obtenerPermisos(rol.getIdRol()));
        return dto;
    }

    private Rol toEntity(RolDTO dto) {
        Rol rol = new Rol();
        rol.setNombre(dto.getNombre());
        rol.setDescripcion(dto.getDescripcion());
        return rol;
    }
}
