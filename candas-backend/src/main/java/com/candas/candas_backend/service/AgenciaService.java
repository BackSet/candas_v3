package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.AgenciaDTO;
import com.candas.candas_backend.dto.TelefonoAgenciaDTO;
import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.TelefonoAgencia;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.AgenciaRepository;
import com.candas.candas_backend.repository.TelefonoAgenciaRepository;
import com.candas.candas_backend.repository.spec.AgenciaSpecs;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

@Service
@Transactional
public class AgenciaService {

    private final AgenciaRepository agenciaRepository;
    private final TelefonoAgenciaRepository telefonoAgenciaRepository;

    public AgenciaService(AgenciaRepository agenciaRepository, TelefonoAgenciaRepository telefonoAgenciaRepository) {
        this.agenciaRepository = agenciaRepository;
        this.telefonoAgenciaRepository = telefonoAgenciaRepository;
    }

    @PostConstruct
    public void initCodes() {
        List<Agencia> todasLasAgencias = agenciaRepository.findAll();
        int count = 0;
        for (Agencia agencia : todasLasAgencias) {
            String codigo = agencia.getCodigo();
            // Verifica si es nulo, vacío o NO es un número de 10 dígitos
            if (codigo == null || codigo.trim().isEmpty() || !codigo.matches("\\d{10}")) {
                agencia.setCodigo(generarCodigoUnico());
                agenciaRepository.save(agencia);
                count++;
            }
        }
        if (count > 0) {
            System.out.println("Se actualizaron/generaron códigos para " + count + " agencias.");
        }
    }

    public Page<AgenciaDTO> findAll(Pageable pageable, String search, String nombre, String codigo, Boolean activa) {
        var spec = AgenciaSpecs.withFilters(search, nombre, codigo, activa);
        return agenciaRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public AgenciaDTO findById(Long id) {
        Agencia agencia = agenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", id));
        return toDTO(agencia);
    }

    public List<AgenciaDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = agenciaRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Agencia> agencias = agenciaRepository.findAllById(ids);
        // Inicializar telefonos manualmente
        for (Agencia agencia : agencias) {
            Hibernate.initialize(agencia.getTelefonos());
        }
        return agencias.stream()
                .map(this::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public AgenciaDTO create(AgenciaDTO dto) {
        Agencia agencia = toEntity(dto);
        agencia.setActiva(true);

        // Generar código único si no viene en el DTO (o si viene vacío)
        if (agencia.getCodigo() == null || agencia.getCodigo().trim().isEmpty()) {
            agencia.setCodigo(generarCodigoUnico());
        }

        Agencia savedAgencia = agenciaRepository.save(agencia);

        // Guardar teléfonos
        if (dto.getTelefonos() != null && !dto.getTelefonos().isEmpty()) {
            List<TelefonoAgencia> telefonos = new ArrayList<>();
            for (TelefonoAgenciaDTO telefonoDTO : dto.getTelefonos()) {
                TelefonoAgencia telefono = new TelefonoAgencia();
                telefono.setAgencia(savedAgencia);
                telefono.setNumero(telefonoDTO.getNumero());
                telefono.setPrincipal(telefonoDTO.getPrincipal() != null ? telefonoDTO.getPrincipal() : false);
                telefono.setFechaRegistro(LocalDateTime.now());
                telefonos.add(telefono);
            }
            // Asegurar que al menos uno sea principal
            if (telefonos.stream().noneMatch(TelefonoAgencia::getPrincipal)) {
                telefonos.get(0).setPrincipal(true);
            }
            telefonoAgenciaRepository.saveAll(telefonos);
        }

        return toDTO(savedAgencia);
    }

    public AgenciaDTO update(Long id, AgenciaDTO dto) {
        Agencia agencia = agenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", id));

        agencia.setNombre(dto.getNombre());
        agencia.setCodigo(dto.getCodigo());
        agencia.setDireccion(dto.getDireccion());
        agencia.setEmail(dto.getEmail());
        agencia.setCanton(dto.getCanton());
        agencia.setNombrePersonal(dto.getNombrePersonal());
        agencia.setHorarioAtencion(dto.getHorarioAtencion());
        if (dto.getActiva() != null) {
            agencia.setActiva(dto.getActiva());
        }

        Agencia savedAgencia = agenciaRepository.save(agencia);

        // Actualizar teléfonos
        if (dto.getTelefonos() != null) {
            // Eliminar teléfonos existentes
            telefonoAgenciaRepository.deleteAll(telefonoAgenciaRepository.findByAgencia(savedAgencia));

            // Crear nuevos teléfonos
            if (!dto.getTelefonos().isEmpty()) {
                List<TelefonoAgencia> telefonos = new ArrayList<>();
                for (TelefonoAgenciaDTO telefonoDTO : dto.getTelefonos()) {
                    TelefonoAgencia telefono = new TelefonoAgencia();
                    telefono.setAgencia(savedAgencia);
                    telefono.setNumero(telefonoDTO.getNumero());
                    telefono.setPrincipal(telefonoDTO.getPrincipal() != null ? telefonoDTO.getPrincipal() : false);
                    telefono.setFechaRegistro(telefonoDTO.getFechaRegistro() != null ? telefonoDTO.getFechaRegistro()
                            : LocalDateTime.now());
                    telefonos.add(telefono);
                }
                // Asegurar que al menos uno sea principal
                if (telefonos.stream().noneMatch(TelefonoAgencia::getPrincipal)) {
                    telefonos.get(0).setPrincipal(true);
                }
                telefonoAgenciaRepository.saveAll(telefonos);
            }
        }

        return toDTO(savedAgencia);
    }

    public void delete(Long id) {
        Agencia agencia = agenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", id));
        agencia.setActiva(false);
        agenciaRepository.save(agencia);
    }

    private String generarCodigoUnico() {
        java.util.Random random = new java.util.Random();
        String codigo;
        do {
            // Generar número de 10 dígitos (asegurar que tenga 10 usando format si es
            // necesario,
            // pero nextLong con límites es más fácil. 10^9 a 10^10 - 1)
            // Forma simple: string builder con 10 random ints
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 10; i++) {
                sb.append(random.nextInt(10));
            }
            codigo = sb.toString();
        } while (agenciaRepository.existsByCodigo(codigo));
        return codigo;
    }

    private AgenciaDTO toDTO(Agencia agencia) {
        AgenciaDTO dto = new AgenciaDTO();
        dto.setIdAgencia(agencia.getIdAgencia());
        dto.setNombre(agencia.getNombre());
        dto.setCodigo(agencia.getCodigo());
        dto.setDireccion(agencia.getDireccion());
        dto.setEmail(agencia.getEmail());
        dto.setCanton(agencia.getCanton());
        dto.setNombrePersonal(agencia.getNombrePersonal());
        dto.setHorarioAtencion(agencia.getHorarioAtencion());
        dto.setActiva(agencia.getActiva());

        // Cargar teléfonos
        List<TelefonoAgencia> telefonos = telefonoAgenciaRepository.findByAgencia(agencia);
        List<TelefonoAgenciaDTO> telefonosDTO = telefonos.stream()
                .map(t -> {
                    TelefonoAgenciaDTO telDTO = new TelefonoAgenciaDTO();
                    telDTO.setIdTelefono(t.getIdTelefono());
                    telDTO.setIdAgencia(t.getAgencia().getIdAgencia());
                    telDTO.setNumero(t.getNumero());
                    telDTO.setPrincipal(t.getPrincipal());
                    telDTO.setFechaRegistro(t.getFechaRegistro());
                    return telDTO;
                })
                .collect(Collectors.toList());
        dto.setTelefonos(telefonosDTO);

        return dto;
    }

    private Agencia toEntity(AgenciaDTO dto) {
        Agencia agencia = new Agencia();
        agencia.setNombre(dto.getNombre());
        agencia.setCodigo(dto.getCodigo());
        agencia.setDireccion(dto.getDireccion());
        agencia.setEmail(dto.getEmail());
        agencia.setCanton(dto.getCanton());
        agencia.setNombrePersonal(dto.getNombrePersonal());
        agencia.setHorarioAtencion(dto.getHorarioAtencion());
        return agencia;
    }
}
