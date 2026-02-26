package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.SacaDTO;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.PaqueteSaca;
import com.candas.candas_backend.entity.PaqueteSacaId;
import com.candas.candas_backend.entity.Saca;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.DespachoRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import com.candas.candas_backend.repository.SacaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class SacaService {

    private final SacaRepository sacaRepository;
    private final DespachoRepository despachoRepository;
    private final PaqueteRepository paqueteRepository;
    private final PaqueteService paqueteService;

    public SacaService(
            SacaRepository sacaRepository,
            DespachoRepository despachoRepository,
            PaqueteRepository paqueteRepository,
            PaqueteService paqueteService) {
        this.sacaRepository = sacaRepository;
        this.despachoRepository = despachoRepository;
        this.paqueteRepository = paqueteRepository;
        this.paqueteService = paqueteService;
    }

    public Page<SacaDTO> findAll(Pageable pageable) {
        return sacaRepository.findAll(pageable).map(this::toDTO);
    }

    public SacaDTO findById(Long id) {
        Saca saca = sacaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Saca", id));
        return toDTO(saca);
    }

    public List<SacaDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = sacaRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return sacaRepository.findAllByIdWithDespacho(ids).stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public SacaDTO create(SacaDTO dto) {
        Saca saca = toEntity(dto);
        saca.setFechaCreacion(LocalDateTime.now());
        
        // El código QR se generará después de guardar (usando el ID)
        
        // Generar número de orden automáticamente si no se proporciona y hay despacho
        if (saca.getNumeroOrden() == null && saca.getDespacho() != null) {
            List<Saca> sacasDelDespacho = sacaRepository.findAll().stream()
                .filter(s -> s.getDespacho() != null && s.getDespacho().getIdDespacho().equals(saca.getDespacho().getIdDespacho()))
                .collect(java.util.stream.Collectors.toList());
            int siguienteOrden = sacasDelDespacho.size() + 1;
            saca.setNumeroOrden(siguienteOrden);
        }
        
        Saca sacaGuardada = sacaRepository.save(saca);
        
        // Generar código QR descriptivo compacto si no se proporcionó
        if (sacaGuardada.getCodigoQr() == null || sacaGuardada.getCodigoQr().isEmpty()) {
            // Si tiene despacho, usar formato descriptivo compacto: SAC-codigoHexDespacho-orden
            if (sacaGuardada.getDespacho() != null && sacaGuardada.getDespacho().getNumeroManifiesto() != null && sacaGuardada.getNumeroOrden() != null) {
                // Extraer el código hexadecimal del número de manifiesto (después de "MAN-")
                String codigoDespacho = sacaGuardada.getDespacho().getNumeroManifiesto().substring(4); // Quitar "MAN-"
                String codigoQr = "SAC-" + codigoDespacho + "-" + String.format("%02d", sacaGuardada.getNumeroOrden());
                sacaGuardada.setCodigoQr(codigoQr);
                sacaGuardada = sacaRepository.save(sacaGuardada);
            } else if (sacaGuardada.getIdSaca() != null) {
                // Fallback a formato hexadecimal del ID si no tiene despacho
                String codigoHex = String.format("%08X", sacaGuardada.getIdSaca());
                sacaGuardada.setCodigoQr("SAC-" + codigoHex);
                sacaGuardada = sacaRepository.save(sacaGuardada);
            } else {
                throw new IllegalStateException("No se pudo generar el código QR: falta información necesaria");
            }
        }
        
        // Asignar paquetes si se proporcionan
        if (dto.getIdPaquetes() != null && !dto.getIdPaquetes().isEmpty()) {
            agregarPaquetes(sacaGuardada.getIdSaca(), dto.getIdPaquetes());
        }
        
        return toDTO(sacaGuardada);
    }

    public SacaDTO update(Long id, SacaDTO dto) {
        Saca saca = sacaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Saca", id));
        
        saca.setCodigoQr(dto.getCodigoQr());
        saca.setNumeroOrden(dto.getNumeroOrden());
        saca.setTamano(dto.getTamano());
        
        if (dto.getIdDespacho() != null) {
            saca.setDespacho(despachoRepository.findById(dto.getIdDespacho())
                .orElseThrow(() -> new ResourceNotFoundException("Despacho", dto.getIdDespacho())));
        }
        
        return toDTO(sacaRepository.save(saca));
    }

    public void delete(Long id) {
        Saca saca = sacaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Saca", id));
        sacaRepository.delete(saca);
    }

    public void agregarPaquetes(Long idSaca, List<Long> idPaquetes) {
        Saca saca = sacaRepository.findById(idSaca)
            .orElseThrow(() -> new ResourceNotFoundException("Saca", idSaca));

        int ordenEnSaca = 1;
        for (Long idPaquete : idPaquetes) {
            Paquete paquete = paqueteRepository.findById(idPaquete)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));

            PaqueteSaca ps = new PaqueteSaca();
            ps.setId(new PaqueteSacaId(paquete.getIdPaquete(), saca.getIdSaca()));
            ps.setPaquete(paquete);
            ps.setSaca(saca);
            ps.setOrdenEnSaca(ordenEnSaca);

            if (paquete.getPaqueteSacas() == null) {
                paquete.setPaqueteSacas(new java.util.ArrayList<>());
            }
            paquete.getPaqueteSacas().add(ps);
            paquete.setEstado(EstadoPaquete.ASIGNADO_SACA);
            paqueteRepository.save(paquete);
            ordenEnSaca++;
        }

        // Recalcular peso total
        calcularPesoTotal(idSaca);
    }

    public List<com.candas.candas_backend.dto.PaqueteDTO> obtenerPaquetes(Long idSaca) {
        // Verificar que la saca existe
        if (!sacaRepository.existsById(idSaca)) {
            throw new ResourceNotFoundException("Saca", idSaca);
        }
        
        // Usar el repositorio de paquetes con EntityGraph para cargar todas las relaciones necesarias
        return paqueteRepository.findBySacaIdSacaOrderByOrdenEnSacaAsc(idSaca).stream()
            .map(paqueteService::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public SacaDTO calcularPesoTotal(Long id) {
        Saca saca = sacaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Saca", id));

        // Solo sumar paquetes ensacados (estado ENSACADO)
        BigDecimal pesoTotal = saca.getPaqueteSacas() == null ? BigDecimal.ZERO : saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO)
            .map(p -> p.getPesoKilos() != null ? p.getPesoKilos() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        saca.setPesoTotal(pesoTotal);
        return toDTO(sacaRepository.save(saca));
    }

    private SacaDTO toDTO(Saca saca) {
        SacaDTO dto = new SacaDTO();
        dto.setIdSaca(saca.getIdSaca());
        dto.setCodigoQr(saca.getCodigoQr());
        dto.setNumeroOrden(saca.getNumeroOrden());
        dto.setTamano(saca.getTamano());
        dto.setPesoTotal(saca.getPesoTotal());
        dto.setFechaCreacion(saca.getFechaCreacion());
        dto.setFechaEnsacado(saca.getFechaEnsacado());
        if (saca.getDespacho() != null) {
            dto.setIdDespacho(saca.getDespacho().getIdDespacho());
            dto.setNumeroManifiesto(saca.getDespacho().getNumeroManifiesto());
        }
        if (saca.getPaqueteSacas() != null) {
            dto.setIdPaquetes(saca.getPaqueteSacas().stream()
                .sorted(Comparator.comparing(PaqueteSaca::getOrdenEnSaca, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(ps -> ps.getPaquete().getIdPaquete())
                .collect(java.util.stream.Collectors.toList()));
        }
        return dto;
    }

    private Saca toEntity(SacaDTO dto) {
        Saca saca = new Saca();
        saca.setCodigoQr(dto.getCodigoQr());
        saca.setNumeroOrden(dto.getNumeroOrden());
        saca.setTamano(dto.getTamano());
        if (dto.getIdDespacho() != null) {
            saca.setDespacho(despachoRepository.findById(dto.getIdDespacho())
                .orElseThrow(() -> new ResourceNotFoundException("Despacho", dto.getIdDespacho())));
        }
        return saca;
    }
}
