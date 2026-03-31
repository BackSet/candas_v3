package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.AtencionPaqueteDTO;
import com.candas.candas_backend.entity.AtencionPaquete;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.EstadoAtencion;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.AtencionPaqueteRepository;
import com.candas.candas_backend.repository.AgenciaRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AtencionPaqueteService {

    private final AtencionPaqueteRepository atencionPaqueteRepository;
    private final AgenciaRepository agenciaRepository;
    private final PaqueteRepository paqueteRepository;
    private final AgenciaScopeResolver agenciaScopeResolver;

    public AtencionPaqueteService(
            AtencionPaqueteRepository atencionPaqueteRepository,
            AgenciaRepository agenciaRepository,
            PaqueteRepository paqueteRepository,
            AgenciaScopeResolver agenciaScopeResolver) {
        this.atencionPaqueteRepository = atencionPaqueteRepository;
        this.agenciaRepository = agenciaRepository;
        this.paqueteRepository = paqueteRepository;
        this.agenciaScopeResolver = agenciaScopeResolver;
    }

    public Page<AtencionPaqueteDTO> findAll(EstadoAtencion estado, String search, Pageable pageable) {
        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        EstadoAtencion estadoFilter = estado;
        Long idAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        return atencionPaqueteRepository.findAllFiltered(estadoFilter, searchTrimmed, idAgencia, pageable).map(this::toDTO);
    }

    public AtencionPaqueteDTO findById(Long id) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        assertAtencionAccesible(atencion);
        return toDTO(atencion);
    }

    public AtencionPaqueteDTO create(AtencionPaqueteDTO dto) {
        Paquete paquete = paqueteRepository.findByIdWithAlcanceAtencion(dto.getIdPaquete())
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", dto.getIdPaquete()));
        assertPaqueteEnAlcanceAtencion(paquete);
        AtencionPaquete atencion = toEntity(dto, paquete);
        resolverAgenciaPropietariaActual().ifPresent(atencion::setAgenciaPropietaria);
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
        assertAtencionAccesible(atencion);

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
        assertAtencionAccesible(atencion);

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
        Paquete paquete = paqueteRepository.findByIdWithAlcanceAtencion(idPaquete)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));
        assertPaqueteEnAlcanceAtencion(paquete);
        return atencionPaqueteRepository.findByPaqueteIdPaquete(idPaquete)
            .stream()
            .filter(this::atencionVisibleParaAlcance)
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<AtencionPaqueteDTO> findPendientes() {
        Long idAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        List<AtencionPaquete> atenciones = atencionPaqueteRepository.findByEstadoAndActivaTrue(EstadoAtencion.PENDIENTE, idAgencia);
        return atenciones.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public void delete(Long id) {
        AtencionPaquete atencion = atencionPaqueteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AtencionPaquete", id));
        assertAtencionAccesible(atencion);
        atencionPaqueteRepository.delete(atencion);
    }

    /**
     * Visible si el paquete tiene agencia destino o lote de recepción en la agencia restringida.
     */
    private void assertPaqueteEnAlcanceAtencion(Paquete paquete) {
        Optional<Long> idAgOpt = agenciaScopeResolver.idAgenciaRestringida();
        if (idAgOpt.isEmpty()) {
            return;
        }
        Long idAg = idAgOpt.get();
        if (paquete.getAgenciaDestino() != null && idAg.equals(paquete.getAgenciaDestino().getIdAgencia())) {
            return;
        }
        if (paquete.getLoteRecepcion() != null && paquete.getLoteRecepcion().getAgencia() != null
                && idAg.equals(paquete.getLoteRecepcion().getAgencia().getIdAgencia())) {
            return;
        }
        throw new AgenciaAccessDeniedException(construirMensajeAccesoAtencion(idAg, paquete, null));
    }

    private void assertAtencionAccesible(AtencionPaquete atencion) {
        Optional<Long> idAgOpt = agenciaScopeResolver.idAgenciaRestringida();
        if (idAgOpt.isEmpty()) return;
        Long idAg = idAgOpt.get();
        if (atencion.getAgenciaPropietaria() != null
                && idAg.equals(atencion.getAgenciaPropietaria().getIdAgencia())) {
            return;
        }
        throw new AgenciaAccessDeniedException(construirMensajeAccesoAtencion(idAg, atencion.getPaquete(), atencion));
    }

    private boolean atencionVisibleParaAlcance(AtencionPaquete atencion) {
        return agenciaScopeResolver.idAgenciaRestringida()
                .map(idAg -> atencion.getAgenciaPropietaria() != null
                        && idAg.equals(atencion.getAgenciaPropietaria().getIdAgencia()))
                .orElse(true);
    }

    private String construirMensajeAccesoAtencion(Long idAgenciaUsuario, Paquete paquete, AtencionPaquete atencion) {
        String agenciaUsuario = agenciaRepository.findById(idAgenciaUsuario)
                .map(this::descripcionAgencia)
                .orElse("agencia con id " + idAgenciaUsuario);
        String agenciaRecurso = "agencia no identificada";
        if (atencion != null && atencion.getAgenciaPropietaria() != null) {
            agenciaRecurso = descripcionAgencia(atencion.getAgenciaPropietaria());
        } else if (paquete != null && paquete.getAgenciaDestino() != null) {
            agenciaRecurso = descripcionAgencia(paquete.getAgenciaDestino());
        } else if (paquete != null && paquete.getLoteRecepcion() != null && paquete.getLoteRecepcion().getAgencia() != null) {
            agenciaRecurso = descripcionAgencia(paquete.getLoteRecepcion().getAgencia());
        }
        return "Tu usuario pertenece a la " + agenciaUsuario
                + ". La atención solicitada pertenece a " + agenciaRecurso
                + ". No tienes acceso a estos datos mientras no inicies sesión con un usuario de esa agencia.";
    }

    private String descripcionAgencia(com.candas.candas_backend.entity.Agencia agencia) {
        if (agencia == null) {
            return "agencia no identificada";
        }
        if (agencia.getCodigo() != null && !agencia.getCodigo().isBlank()) {
            return "agencia \"" + agencia.getNombre() + "\" (código " + agencia.getCodigo() + ")";
        }
        return "agencia \"" + agencia.getNombre() + "\"";
    }

    private AtencionPaqueteDTO toDTO(AtencionPaquete atencion) {
        AtencionPaqueteDTO dto = new AtencionPaqueteDTO();
        dto.setIdAtencion(atencion.getIdAtencion());
        
        if (atencion.getPaquete() != null) {
            dto.setIdPaquete(atencion.getPaquete().getIdPaquete());
            dto.setNumeroGuia(atencion.getPaquete().getNumeroGuia());
        }
        if (atencion.getAgenciaPropietaria() != null) {
            dto.setIdAgenciaPropietaria(atencion.getAgenciaPropietaria().getIdAgencia());
            dto.setNombreAgenciaPropietaria(atencion.getAgenciaPropietaria().getNombre());
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

    private AtencionPaquete toEntity(AtencionPaqueteDTO dto, Paquete paquete) {
        AtencionPaquete atencion = new AtencionPaquete();
        atencion.setMotivo(dto.getMotivo());
        atencion.setTipoProblema(dto.getTipoProblema());
        // No establecer el estado aquí si es null o inválido, se establecerá en create/update
        if (dto.getEstado() != null) {
            atencion.setEstado(dto.getEstado());
        }
        atencion.setObservacionesResolucion(dto.getObservacionesResolucion());
        atencion.setPaquete(paquete);
        return atencion;
    }

    private Optional<com.candas.candas_backend.entity.Agencia> resolverAgenciaPropietariaActual() {
        return agenciaScopeResolver.idAgenciaRestringida()
                .flatMap(agenciaRepository::findById);
    }
}
