package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.PermisoDTO;
import com.candas.candas_backend.entity.Permiso;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.PermisoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PermisoService {

    private final PermisoRepository permisoRepository;

    public PermisoService(PermisoRepository permisoRepository) {
        this.permisoRepository = permisoRepository;
    }

    public Page<PermisoDTO> findAll(Pageable pageable) {
        return permisoRepository.findAll(pageable).map(this::toDTO);
    }

    public PermisoDTO findById(Long id) {
        Permiso permiso = permisoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Permiso", id));
        return toDTO(permiso);
    }

    public List<PermisoDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = permisoRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return permisoRepository.findAllById(ids).stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public PermisoDTO create(PermisoDTO dto) {
        Permiso permiso = toEntity(dto);
        return toDTO(permisoRepository.save(permiso));
    }

    public PermisoDTO update(Long id, PermisoDTO dto) {
        Permiso permiso = permisoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Permiso", id));
        
        permiso.setNombre(dto.getNombre());
        permiso.setDescripcion(dto.getDescripcion());
        permiso.setRecurso(dto.getRecurso());
        permiso.setAccion(dto.getAccion());
        
        return toDTO(permisoRepository.save(permiso));
    }

    public void delete(Long id) {
        Permiso permiso = permisoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Permiso", id));
        permisoRepository.delete(permiso);
    }

    private PermisoDTO toDTO(Permiso permiso) {
        PermisoDTO dto = new PermisoDTO();
        dto.setIdPermiso(permiso.getIdPermiso());
        dto.setNombre(permiso.getNombre());
        dto.setDescripcion(permiso.getDescripcion());
        dto.setRecurso(permiso.getRecurso());
        dto.setAccion(permiso.getAccion());
        return dto;
    }

    private Permiso toEntity(PermisoDTO dto) {
        Permiso permiso = new Permiso();
        permiso.setNombre(dto.getNombre());
        permiso.setDescripcion(dto.getDescripcion());
        permiso.setRecurso(dto.getRecurso());
        permiso.setAccion(dto.getAccion());
        return permiso;
    }
}
