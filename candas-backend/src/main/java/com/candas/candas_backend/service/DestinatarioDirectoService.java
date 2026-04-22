package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.DestinatarioDirectoDTO;
import com.candas.candas_backend.entity.DestinatarioDirecto;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.DestinatarioDirectoRepository;
import com.candas.candas_backend.repository.spec.DestinatarioDirectoSpecs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DestinatarioDirectoService {

    private final DestinatarioDirectoRepository destinatarioDirectoRepository;

    public DestinatarioDirectoService(DestinatarioDirectoRepository destinatarioDirectoRepository) {
        this.destinatarioDirectoRepository = destinatarioDirectoRepository;
    }

    public List<DestinatarioDirectoDTO> findAll() {
        return destinatarioDirectoRepository.findByActivoTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<DestinatarioDirectoDTO> findAllPaginado(Pageable pageable, String search, Boolean activo) {
        boolean sinFiltros = (search == null || search.isBlank()) && activo == null;
        if (sinFiltros) {
            return destinatarioDirectoRepository.findAll(pageable).map(this::toDTO);
        }
        return destinatarioDirectoRepository
                .findAll(DestinatarioDirectoSpecs.withFilters(search, activo), pageable)
                .map(this::toDTO);
    }

    public DestinatarioDirectoDTO findById(Long id) {
        DestinatarioDirecto destinatario = destinatarioDirectoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", id));
        return toDTO(destinatario);
    }

    public DestinatarioDirectoDTO create(DestinatarioDirectoDTO dto) {
        DestinatarioDirecto destinatario = new DestinatarioDirecto();
        destinatario.setNombreDestinatario(dto.getNombreDestinatario());
        destinatario.setTelefonoDestinatario(dto.getTelefonoDestinatario());
        destinatario.setDireccionDestinatario(dto.getDireccionDestinatario());
        destinatario.setCanton(dto.getCanton());
        destinatario.setCodigo(dto.getCodigo());
        destinatario.setNombreEmpresa(dto.getNombreEmpresa());
        destinatario.setFechaRegistro(LocalDateTime.now());
        destinatario.setActivo(true);

        return toDTO(destinatarioDirectoRepository.save(destinatario));
    }

    public DestinatarioDirectoDTO update(Long id, DestinatarioDirectoDTO dto) {
        DestinatarioDirecto destinatario = destinatarioDirectoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", id));

        destinatario.setNombreDestinatario(dto.getNombreDestinatario());
        destinatario.setTelefonoDestinatario(dto.getTelefonoDestinatario());
        destinatario.setDireccionDestinatario(dto.getDireccionDestinatario());
        destinatario.setCanton(dto.getCanton());
        destinatario.setCodigo(dto.getCodigo());
        destinatario.setNombreEmpresa(dto.getNombreEmpresa());

        return toDTO(destinatarioDirectoRepository.save(destinatario));
    }

    public List<DestinatarioDirectoDTO> search(String query) {
        List<DestinatarioDirecto> resultados = destinatarioDirectoRepository.search(query);

        return resultados.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DestinatarioDirectoDTO buscarOCrear(String telefono, String nombre, String direccion) {
        return destinatarioDirectoRepository.findByTelefonoDestinatarioAndActivoTrue(telefono)
                .map(this::toDTO)
                .orElseGet(() -> {
                    DestinatarioDirectoDTO nuevoDestinatario = new DestinatarioDirectoDTO();
                    nuevoDestinatario.setNombreDestinatario(nombre);
                    nuevoDestinatario.setTelefonoDestinatario(telefono);
                    nuevoDestinatario.setDireccionDestinatario(direccion);
                    nuevoDestinatario.setCanton(null); // Cantón no disponible en este método
                    return create(nuevoDestinatario);
                });
    }

    public void delete(Long id) {
        DestinatarioDirecto destinatario = destinatarioDirectoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", id));

        // Soft delete: marcar como inactivo
        destinatario.setActivo(false);
        destinatarioDirectoRepository.save(destinatario);
    }

    private DestinatarioDirectoDTO toDTO(DestinatarioDirecto destinatario) {
        DestinatarioDirectoDTO dto = new DestinatarioDirectoDTO();
        dto.setIdDestinatarioDirecto(destinatario.getIdDestinatarioDirecto());
        dto.setNombreDestinatario(destinatario.getNombreDestinatario());
        dto.setTelefonoDestinatario(destinatario.getTelefonoDestinatario());
        dto.setDireccionDestinatario(destinatario.getDireccionDestinatario());
        dto.setCanton(destinatario.getCanton());
        dto.setCodigo(destinatario.getCodigo());
        dto.setNombreEmpresa(destinatario.getNombreEmpresa());
        dto.setFechaRegistro(destinatario.getFechaRegistro());
        dto.setActivo(destinatario.getActivo());
        return dto;
    }
}
