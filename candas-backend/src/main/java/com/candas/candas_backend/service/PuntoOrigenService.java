package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.PuntoOrigenDTO;
import com.candas.candas_backend.entity.PuntoOrigen;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.PuntoOrigenRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PuntoOrigenService {

    private final PuntoOrigenRepository puntoOrigenRepository;

    public PuntoOrigenService(PuntoOrigenRepository puntoOrigenRepository) {
        this.puntoOrigenRepository = puntoOrigenRepository;
    }

    public Page<PuntoOrigenDTO> findAll(Pageable pageable) {
        return puntoOrigenRepository.findAll(pageable).map(this::toDTO);
    }

    public PuntoOrigenDTO findById(Long id) {
        PuntoOrigen puntoOrigen = puntoOrigenRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PuntoOrigen", id));
        return toDTO(puntoOrigen);
    }

    public List<PuntoOrigenDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = puntoOrigenRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return puntoOrigenRepository.findAllById(ids).stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public PuntoOrigenDTO create(PuntoOrigenDTO dto) {
        PuntoOrigen puntoOrigen = toEntity(dto);
        puntoOrigen.setActivo(true);
        return toDTO(puntoOrigenRepository.save(puntoOrigen));
    }

    public PuntoOrigenDTO update(Long id, PuntoOrigenDTO dto) {
        PuntoOrigen puntoOrigen = puntoOrigenRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PuntoOrigen", id));
        
        puntoOrigen.setNombrePuntoOrigen(dto.getNombrePuntoOrigen());
        if (dto.getActivo() != null) {
            puntoOrigen.setActivo(dto.getActivo());
        }
        
        return toDTO(puntoOrigenRepository.save(puntoOrigen));
    }

    public void delete(Long id) {
        PuntoOrigen puntoOrigen = puntoOrigenRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PuntoOrigen", id));
        puntoOrigen.setActivo(false);
        puntoOrigenRepository.save(puntoOrigen);
    }

    private PuntoOrigenDTO toDTO(PuntoOrigen puntoOrigen) {
        PuntoOrigenDTO dto = new PuntoOrigenDTO();
        dto.setIdPuntoOrigen(puntoOrigen.getIdPuntoOrigen());
        dto.setNombrePuntoOrigen(puntoOrigen.getNombrePuntoOrigen());
        dto.setActivo(puntoOrigen.getActivo());
        return dto;
    }

    private PuntoOrigen toEntity(PuntoOrigenDTO dto) {
        PuntoOrigen puntoOrigen = new PuntoOrigen();
        puntoOrigen.setNombrePuntoOrigen(dto.getNombrePuntoOrigen());
        return puntoOrigen;
    }
}
