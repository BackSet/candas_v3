package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.ClienteDTO;
import com.candas.candas_backend.entity.Cliente;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.ClienteRepository;
import com.candas.candas_backend.repository.spec.ClienteSpecs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public Page<ClienteDTO> findAll(Pageable pageable, String search, String nombre, String documento, String email, Boolean activo) {
        var spec = ClienteSpecs.withFilters(search, nombre, documento, email, activo);
        return clienteRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public List<ClienteDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = clienteRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Cliente> clientes = clienteRepository.findAllById(ids);
        return clientes.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public ClienteDTO findById(Long id) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        return toDTO(cliente);
    }

    public ClienteDTO create(ClienteDTO dto) {
        Cliente cliente = toEntity(dto);
        cliente.setFechaRegistro(LocalDateTime.now());
        cliente.setActivo(true);

        return toDTO(clienteRepository.save(cliente));
    }

    public ClienteDTO update(Long id, ClienteDTO dto) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        
        cliente.setNombreCompleto(dto.getNombreCompleto());
        cliente.setDocumentoIdentidad(dto.getDocumentoIdentidad());
        cliente.setEmail(dto.getEmail());
        cliente.setPais(dto.getPais());
        cliente.setCiudad(dto.getCiudad());
        cliente.setCanton(dto.getCanton());
        cliente.setDireccion(dto.getDireccion());
        cliente.setTelefono(dto.getTelefono());
        if (dto.getActivo() != null) {
            cliente.setActivo(dto.getActivo());
        }

        return toDTO(clienteRepository.save(cliente));
    }

    public void delete(Long id) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    private ClienteDTO toDTO(Cliente cliente) {
        ClienteDTO dto = new ClienteDTO();
        dto.setIdCliente(cliente.getIdCliente());
        dto.setNombreCompleto(cliente.getNombreCompleto());
        dto.setDocumentoIdentidad(cliente.getDocumentoIdentidad());
        dto.setEmail(cliente.getEmail());
        dto.setPais(cliente.getPais());
        dto.setCiudad(cliente.getCiudad());
        dto.setCanton(cliente.getCanton());
        dto.setDireccion(cliente.getDireccion());
        dto.setTelefono(cliente.getTelefono());
        dto.setFechaRegistro(cliente.getFechaRegistro());
        dto.setActivo(cliente.getActivo());

        return dto;
    }

    private Cliente toEntity(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        cliente.setNombreCompleto(dto.getNombreCompleto());
        cliente.setDocumentoIdentidad(dto.getDocumentoIdentidad());
        cliente.setEmail(dto.getEmail());
        cliente.setPais(dto.getPais());
        cliente.setCiudad(dto.getCiudad());
        cliente.setCanton(dto.getCanton());
        cliente.setDireccion(dto.getDireccion());
        cliente.setTelefono(dto.getTelefono());
        return cliente;
    }
}
