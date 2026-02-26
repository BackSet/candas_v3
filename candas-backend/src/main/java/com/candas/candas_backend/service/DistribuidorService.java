package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.DistribuidorDTO;
import com.candas.candas_backend.entity.Distribuidor;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.DistribuidorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DistribuidorService {

    private final DistribuidorRepository distribuidorRepository;

    public DistribuidorService(DistribuidorRepository distribuidorRepository) {
        this.distribuidorRepository = distribuidorRepository;
    }

    public Page<DistribuidorDTO> findAll(Pageable pageable) {
        return distribuidorRepository.findAll(pageable).map(this::toDTO);
    }

    public DistribuidorDTO findById(Long id) {
        Distribuidor distribuidor = distribuidorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", id));
        return toDTO(distribuidor);
    }

    public List<DistribuidorDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = distribuidorRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return distribuidorRepository.findAllById(ids).stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public DistribuidorDTO create(DistribuidorDTO dto) {
        Distribuidor distribuidor = toEntity(dto);
        distribuidor.setActiva(true);
        return toDTO(distribuidorRepository.save(distribuidor));
    }

    public DistribuidorDTO update(Long id, DistribuidorDTO dto) {
        Distribuidor distribuidor = distribuidorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", id));
        
        distribuidor.setNombre(dto.getNombre());
        distribuidor.setCodigo(dto.getCodigo());
        distribuidor.setEmail(dto.getEmail());
        if (dto.getActiva() != null) {
            distribuidor.setActiva(dto.getActiva());
        }
        
        return toDTO(distribuidorRepository.save(distribuidor));
    }

    public void delete(Long id) {
        Distribuidor distribuidor = distribuidorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", id));
        distribuidor.setActiva(false);
        distribuidorRepository.save(distribuidor);
    }

    public DistribuidorDTO buscarOCrear(String nombre, String codigo) {
        // Buscar por código primero si está disponible
        if (codigo != null && !codigo.trim().isEmpty()) {
            return distribuidorRepository.findByCodigoIgnoreCase(codigo.trim())
                .map(this::toDTO)
                .orElseGet(() -> {
                    // Crear nueva si no existe
                    DistribuidorDTO nuevoDTO = new DistribuidorDTO();
                    nuevoDTO.setNombre(nombre != null ? nombre.trim() : "Sin nombre");
                    nuevoDTO.setCodigo(codigo.trim());
                    nuevoDTO.setActiva(true);
                    return create(nuevoDTO);
                });
        }
        
        // Buscar por nombre si no hay código
        if (nombre != null && !nombre.trim().isEmpty()) {
            return distribuidorRepository.findByNombreIgnoreCase(nombre.trim())
                .map(this::toDTO)
                .orElseGet(() -> {
                    // Crear nueva si no existe
                    DistribuidorDTO nuevoDTO = new DistribuidorDTO();
                    nuevoDTO.setNombre(nombre.trim());
                    nuevoDTO.setActiva(true);
                    return create(nuevoDTO);
                });
        }
        
        // Si no hay nombre ni código, crear con nombre por defecto
        DistribuidorDTO nuevoDTO = new DistribuidorDTO();
        nuevoDTO.setNombre("Sin nombre");
        nuevoDTO.setActiva(true);
        return create(nuevoDTO);
    }

    private DistribuidorDTO toDTO(Distribuidor distribuidor) {
        DistribuidorDTO dto = new DistribuidorDTO();
        dto.setIdDistribuidor(distribuidor.getIdDistribuidor());
        dto.setNombre(distribuidor.getNombre());
        dto.setCodigo(distribuidor.getCodigo());
        dto.setEmail(distribuidor.getEmail());
        dto.setActiva(distribuidor.getActiva());
        return dto;
    }

    private Distribuidor toEntity(DistribuidorDTO dto) {
        Distribuidor distribuidor = new Distribuidor();
        distribuidor.setNombre(dto.getNombre());
        distribuidor.setCodigo(dto.getCodigo());
        distribuidor.setEmail(dto.getEmail());
        return distribuidor;
    }
}
