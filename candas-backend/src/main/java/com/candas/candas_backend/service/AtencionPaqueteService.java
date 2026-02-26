package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.AtencionPaqueteDTO;
import com.candas.candas_backend.entity.AtencionPaquete;
import com.candas.candas_backend.entity.enums.EstadoAtencion;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.AtencionPaqueteRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AtencionPaqueteService {

    private final AtencionPaqueteRepository atencionPaqueteRepository;
    private final PaqueteRepository paqueteRepository;

    public AtencionPaqueteService(
            AtencionPaqueteRepository atencionPaqueteRepository,
            PaqueteRepository paqueteRepository) {
        this.atencionPaqueteRepository = atencionPaqueteRepository;
        this.paqueteRepository = paqueteRepository;
    }

    public Page<AtencionPaqueteDTO> findAll(EstadoAtencion estado, String search, Pageable pageable) {
        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        EstadoAtencion estadoFilter = estado;
        return atencionPaqueteRepository.findAllFiltered(estadoFilter, searchTrimmed, pageable).map(this::toDTO);
    }

    public AtencionPaqueteDTO findById(Long id) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        return toDTO(atencion);
    }

    public AtencionPaqueteDTO create(AtencionPaqueteDTO dto) {
        AtencionPaquete atencion = toEntity(dto);
        atencion.setFechaSolicitud(LocalDateTime.now());
        atencion.setEstado(EstadoAtencion.PENDIENTE);
        atencion.setActiva(true);
        
        // Desactivar otras atenciones activas del mismo paquete
        atencionPaqueteRepository.findByPaqueteIdPaqueteAndActivaTrue(dto.getIdPaquete())
            .forEach(a -> {
                a.setActiva(false);
                atencionPaqueteRepository.save(a);
            });
        
        return toDTO(atencionPaqueteRepository.save(atencion));
    }

    public AtencionPaqueteDTO update(Long id, AtencionPaqueteDTO dto) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        
        atencion.setMotivo(dto.getMotivo());
        atencion.setTipoProblema(dto.getTipoProblema());
        atencion.setEstado(dto.getEstado());
        atencion.setObservacionesResolucion(dto.getObservacionesResolucion());
        
        if (dto.getEstado() == EstadoAtencion.RESUELTO && atencion.getFechaResolucion() == null) {
            atencion.setFechaResolucion(LocalDateTime.now());
            atencion.setActiva(false);
        }
        
        return toDTO(atencionPaqueteRepository.save(atencion));
    }

    public AtencionPaqueteDTO resolver(Long id, String observacionesResolucion) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        
        if (atencion.getEstado() == EstadoAtencion.RESUELTO) {
            throw new BadRequestException("La atención ya está resuelta");
        }
        
        atencion.setEstado(EstadoAtencion.RESUELTO);
        atencion.setFechaResolucion(LocalDateTime.now());
        atencion.setObservacionesResolucion(observacionesResolucion);
        atencion.setActiva(false);
        
        return toDTO(atencionPaqueteRepository.save(atencion));
    }

    public List<AtencionPaqueteDTO> findByPaquete(Long idPaquete) {
        return atencionPaqueteRepository.findByPaqueteIdPaquete(idPaquete)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<AtencionPaqueteDTO> findPendientes() {
        List<AtencionPaquete> atenciones = atencionPaqueteRepository.findByEstadoAndActivaTrue(EstadoAtencion.PENDIENTE);
        return atenciones.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public void delete(Long id) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        atencionPaqueteRepository.delete(atencion);
    }

    private AtencionPaqueteDTO toDTO(AtencionPaquete atencion) {
        AtencionPaqueteDTO dto = new AtencionPaqueteDTO();
        dto.setIdAtencion(atencion.getIdAtencion());
        
        if (atencion.getPaquete() != null) {
            dto.setIdPaquete(atencion.getPaquete().getIdPaquete());
            dto.setNumeroGuia(atencion.getPaquete().getNumeroGuia());
        }
        
        dto.setMotivo(atencion.getMotivo());
        dto.setTipoProblema(atencion.getTipoProblema());
        dto.setFechaSolicitud(atencion.getFechaSolicitud());
        dto.setFechaResolucion(atencion.getFechaResolucion());
        dto.setEstado(atencion.getEstado());
        dto.setObservacionesResolucion(atencion.getObservacionesResolucion());
        dto.setActiva(atencion.getActiva());
        return dto;
    }

    private AtencionPaquete toEntity(AtencionPaqueteDTO dto) {
        AtencionPaquete atencion = new AtencionPaquete();
        atencion.setMotivo(dto.getMotivo());
        atencion.setTipoProblema(dto.getTipoProblema());
        // No establecer el estado aquí si es null o inválido, se establecerá en create/update
        if (dto.getEstado() != null) {
            atencion.setEstado(dto.getEstado());
        }
        atencion.setObservacionesResolucion(dto.getObservacionesResolucion());
        atencion.setPaquete(paqueteRepository.findById(dto.getIdPaquete())
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", dto.getIdPaquete())));
        return atencion;
    }
}
