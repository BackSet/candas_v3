package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.AsociarCadenitaLoteDTO;
import com.candas.candas_backend.dto.AsociarCadenitaLoteResultDTO;
import com.candas.candas_backend.dto.AsociarClementinaLoteDTO;
import com.candas.candas_backend.dto.AsociarClementinaLoteResultDTO;
import com.candas.candas_backend.dto.PaqueteDTO;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.mapper.PaqueteMapper;
import com.candas.candas_backend.repository.PaqueteRepository;
import com.candas.candas_backend.validation.PaqueteValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaqueteHierarchyService {

    private final PaqueteRepository paqueteRepository;
    private final PaqueteMapper paqueteMapper;
    private final PaqueteValidator paqueteValidator;

    public PaqueteHierarchyService(
            PaqueteRepository paqueteRepository,
            PaqueteMapper paqueteMapper,
            PaqueteValidator paqueteValidator) {
        this.paqueteRepository = paqueteRepository;
        this.paqueteMapper = paqueteMapper;
        this.paqueteValidator = paqueteValidator;
    }

    public List<PaqueteDTO> findHijos(Long idPaquetePadre) {
        return paqueteRepository.findByPaquetePadreIdPaquete(idPaquetePadre)
                .stream()
                .map(paqueteMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PaqueteDTO> findHijosCadenita(String numeroGuiaPadre) {
        Paquete padre = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuiaPadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete padre no encontrado: " + numeroGuiaPadre));

        return paqueteRepository.findByPaquetePadreIdPaquete(padre.getIdPaquete())
                .stream()
                .filter(p -> TipoPaquete.CADENITA.equals(p.getTipoPaquete()))
                .map(paqueteMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Verifica qué paquetes CLEMENTINA de una lista tienen hijos asociados
     * 
     * @param ids Lista de IDs de paquetes a verificar
     * @return Set de IDs de paquetes que tienen hijos
     */
    public Set<Long> verificarClementinaConHijos(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptySet();
        }
        List<Long> idsConHijos = paqueteRepository.findClementinaConHijos(ids);
        return new HashSet<>(idsConHijos);
    }

    public List<PaqueteDTO> separarPaquete(Long idPaquetePadre, List<PaqueteDTO> paquetesHijos) {
        Paquete paquetePadre = paqueteRepository.findById(idPaquetePadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquetePadre));

        if (paquetePadre.getTipoPaquete() != TipoPaquete.SEPARAR) {
            throw new BadRequestException("El paquete debe ser de tipo SEPARAR para poder separarlo");
        }

        if (paquetePadre.getPaquetePadre() != null) {
            throw new BadRequestException("Solo los paquetes padre pueden ser separados");
        }

        // Marcar el paquete padre como separado
        if (paquetePadre.getSeparado() == null || !paquetePadre.getSeparado()) {
            paquetePadre.setSeparado(true);
            paquetePadre.setFechaSeparado(LocalDateTime.now());
            paqueteRepository.save(paquetePadre);
        }

        List<PaqueteDTO> hijosCreados = new ArrayList<>();

        for (PaqueteDTO hijoDTO : paquetesHijos) {
            hijoDTO.setTipoPaquete(TipoPaquete.SEPARAR);
            hijoDTO.setIdPaquetePadre(idPaquetePadre);
            hijoDTO.setIdClienteRemitente(paquetePadre.getClienteRemitente().getIdCliente());
            hijoDTO.setEstado(EstadoPaquete.REGISTRADO);

            Paquete hijo = paqueteMapper.toEntity(hijoDTO);
            hijo.setFechaRegistro(LocalDateTime.now());
            paqueteValidator.validatePaquete(hijo);

            hijosCreados.add(paqueteMapper.toDTO(paqueteRepository.save(hijo)));
        }

        return hijosCreados;
    }

    public List<PaqueteDTO> asignarHijosAClementina(Long idPaquetePadre, List<Long> idPaquetesHijos) {
        // Validar que el paquete padre existe
        Paquete paquetePadre = paqueteRepository.findById(idPaquetePadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquetePadre));

        // Convertir automáticamente el paquete padre a tipo CLEMENTINA si no lo es
        if (paquetePadre.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
            paquetePadre.setTipoPaquete(TipoPaquete.CLEMENTINA);
            paqueteRepository.save(paquetePadre);
        }

        // Validar que el paquete padre no tenga ya un padre
        if (paquetePadre.getPaquetePadre() != null) {
            throw new BadRequestException("Solo los paquetes padre pueden tener hijos asignados");
        }

        // Validar que la lista de hijos no esté vacía
        if (idPaquetesHijos == null || idPaquetesHijos.isEmpty()) {
            throw new BadRequestException("Debe proporcionar al menos un paquete hijo");
        }

        List<PaqueteDTO> hijosAsignados = new ArrayList<>();

        for (Long idPaqueteHijo : idPaquetesHijos) {
            // Validar que el paquete hijo existe
            Paquete paqueteHijo = paqueteRepository.findById(idPaqueteHijo)
                    .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaqueteHijo));

            // Validar que el paquete hijo no tenga ya un padre
            if (paqueteHijo.getPaquetePadre() != null) {
                throw new BadRequestException(
                        String.format("El paquete %s ya tiene un padre asignado",
                                paqueteHijo.getNumeroGuia() != null ? paqueteHijo.getNumeroGuia()
                                        : "ID: " + idPaqueteHijo));
            }

            // Validar que el paquete hijo no sea el mismo que el padre
            if (paqueteHijo.getIdPaquete().equals(idPaquetePadre)) {
                throw new BadRequestException("Un paquete no puede ser hijo de sí mismo");
            }

            // Asignar el padre al hijo
            paqueteHijo.setPaquetePadre(paquetePadre);
            paqueteRepository.save(paqueteHijo);

            hijosAsignados.add(paqueteMapper.toDTO(paqueteHijo));
        }

        return hijosAsignados;
    }

    public PaqueteDTO asignarHijoPorNumeroGuia(Long idPaquetePadre, String numeroGuia) {
        // Validar que el paquete padre existe
        Paquete paquetePadre = paqueteRepository.findById(idPaquetePadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquetePadre));

        // Convertir automáticamente el paquete padre a tipo CLEMENTINA si no lo es
        if (paquetePadre.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
            paquetePadre.setTipoPaquete(TipoPaquete.CLEMENTINA);
            paqueteRepository.save(paquetePadre);
        }

        // Validar que el paquete padre no tenga ya un padre
        if (paquetePadre.getPaquetePadre() != null) {
            throw new BadRequestException("Solo los paquetes padre pueden tener hijos asignados");
        }

        // Validar que el número de guía no esté vacío
        if (numeroGuia == null || numeroGuia.trim().isEmpty()) {
            throw new BadRequestException("Debe proporcionar un número de guía válido");
        }

        // Buscar el paquete hijo por número de guía
        Paquete paqueteHijo = paqueteRepository.findByNumeroGuia(numeroGuia.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Paquete con número de guía: " + numeroGuia));

        // Validar que el paquete hijo no tenga ya un padre
        if (paqueteHijo.getPaquetePadre() != null) {
            throw new BadRequestException(
                    String.format("El paquete %s ya tiene un padre asignado", numeroGuia));
        }

        // Validar que el paquete hijo no sea el mismo que el padre
        if (paqueteHijo.getIdPaquete().equals(idPaquetePadre)) {
            throw new BadRequestException("Un paquete no puede ser hijo de sí mismo");
        }

        // Asignar el padre al hijo
        paqueteHijo.setPaquetePadre(paquetePadre);
        paqueteRepository.save(paqueteHijo);

        return paqueteMapper.toDTO(paqueteHijo);
    }

    /**
     * Desasocia un paquete hijo de su padre, convirtiéndolo en un paquete
     * independiente
     * Si el paquete no tiene padre, no hace nada
     */
    public PaqueteDTO desasociarHijoDePadre(String numeroGuia) {
        Paquete paquete = paqueteRepository.findByNumeroGuia(numeroGuia.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Paquete con número de guía: " + numeroGuia));

        if (paquete.getPaquetePadre() == null) {
            // Ya es independiente, no hay nada que hacer
            return paqueteMapper.toDTO(paquete);
        }

        // Desasociar del padre
        paquete.setPaquetePadre(null);
        paqueteRepository.save(paquete);

        return paqueteMapper.toDTO(paquete);
    }

    /**
     * Desasocia todos los hijos de un paquete padre, convirtiéndolo en un paquete
     * independiente
     * Si el paquete no tiene hijos, no hace nada
     */
    public PaqueteDTO desasociarHijosDePadre(String numeroGuia) {
        Paquete paquete = paqueteRepository.findByNumeroGuia(numeroGuia.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Paquete con número de guía: " + numeroGuia));

        // Buscar todos los hijos de este paquete
        List<Paquete> hijos = paqueteRepository.findByPaquetePadreIdPaquete(paquete.getIdPaquete());

        if (hijos.isEmpty()) {
            // No tiene hijos, no hay nada que hacer
            return paqueteMapper.toDTO(paquete);
        }

        // Desasociar todos los hijos
        for (Paquete hijo : hijos) {
            hijo.setPaquetePadre(null);
            paqueteRepository.save(hijo);
        }

        return paqueteMapper.toDTO(paquete);
    }

    public AsociarClementinaLoteResultDTO asociarClementinaPorLote(AsociarClementinaLoteDTO dto) {
        if (dto == null || dto.getAsociaciones() == null || dto.getAsociaciones().isEmpty()) {
            throw new BadRequestException("Debe proporcionar al menos una asociación");
        }

        List<AsociarClementinaLoteResultDTO.ResultadoAsociacion> resultados = new ArrayList<>();
        int exitosas = 0;
        int fallidas = 0;

        for (AsociarClementinaLoteDTO.ParClementina par : dto.getAsociaciones()) {
            String numeroGuiaPadre = par.getNumeroGuiaPadre();
            String numeroGuiaHijo = par.getNumeroGuiaHijo();

            // Validar que los números de guía no estén vacíos
            if (numeroGuiaPadre == null || numeroGuiaPadre.trim().isEmpty()) {
                resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                        numeroGuiaPadre, numeroGuiaHijo, false,
                        "El número de guía del padre no puede estar vacío"));
                fallidas++;
                continue;
            }

            if (numeroGuiaHijo == null || numeroGuiaHijo.trim().isEmpty()) {
                resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                        numeroGuiaPadre, numeroGuiaHijo, false,
                        "El número de guía del hijo no puede estar vacío"));
                fallidas++;
                continue;
            }

            try {
                // Buscar paquete padre por número de guía
                Paquete paquetePadre = paqueteRepository.findByNumeroGuia(numeroGuiaPadre.trim().toUpperCase())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Paquete padre con número de guía: " + numeroGuiaPadre));

                boolean padreEraHijo = paquetePadre.getPaquetePadre() != null;
                List<Paquete> hijosExistentes = paqueteRepository
                        .findByPaquetePadreIdPaquete(paquetePadre.getIdPaquete());
                boolean padreTeníaHijos = !hijosExistentes.isEmpty();

                // Si el paquete padre tiene un padre (es hijo), desasociarlo primero para
                // convertirlo en padre
                if (padreEraHijo) {
                    paquetePadre.setPaquetePadre(null);
                    paqueteRepository.save(paquetePadre);
                }

                // Si el paquete padre tiene hijos, desasociarlos primero
                if (padreTeníaHijos) {
                    for (Paquete hijoExistente : hijosExistentes) {
                        hijoExistente.setPaquetePadre(null);
                        paqueteRepository.save(hijoExistente);
                    }
                }

                // Convertir automáticamente el paquete padre a tipo CLEMENTINA si no lo es
                if (paquetePadre.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
                    paquetePadre.setTipoPaquete(TipoPaquete.CLEMENTINA);
                    paqueteRepository.save(paquetePadre);
                }

                // Buscar paquete hijo por número de guía
                Paquete paqueteHijo = paqueteRepository.findByNumeroGuia(numeroGuiaHijo.trim().toUpperCase())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Paquete hijo con número de guía: " + numeroGuiaHijo));

                boolean hijoTeníaPadre = paqueteHijo.getPaquetePadre() != null;
                List<Paquete> hijosDelHijo = paqueteRepository.findByPaquetePadreIdPaquete(paqueteHijo.getIdPaquete());
                boolean hijoEraPadre = !hijosDelHijo.isEmpty();

                // Si el paquete hijo tiene un padre, desasociarlo primero
                if (hijoTeníaPadre) {
                    paqueteHijo.setPaquetePadre(null);
                    paqueteRepository.save(paqueteHijo);
                }

                // Si el paquete hijo tiene hijos (es padre), desasociarlos primero
                if (hijoEraPadre) {
                    for (Paquete hijoDelHijo : hijosDelHijo) {
                        hijoDelHijo.setPaquetePadre(null);
                        paqueteRepository.save(hijoDelHijo);
                    }
                }

                // Validar que el paquete hijo no sea el mismo que el padre
                if (paqueteHijo.getIdPaquete().equals(paquetePadre.getIdPaquete())) {
                    resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                            numeroGuiaPadre, numeroGuiaHijo, false,
                            "Un paquete no puede ser hijo de sí mismo"));
                    fallidas++;
                    continue;
                }

                // Asignar el padre al hijo
                paqueteHijo.setPaquetePadre(paquetePadre);
                // Establecer el tipo CLEMENTINA en el paquete hijo
                paqueteHijo.setTipoPaquete(TipoPaquete.CLEMENTINA);
                paqueteRepository.save(paqueteHijo);

                // Construir mensaje descriptivo
                StringBuilder mensaje = new StringBuilder("Asociación exitosa");
                if (padreEraHijo || padreTeníaHijos || hijoTeníaPadre || hijoEraPadre) {
                    mensaje.append(" (");
                    List<String> transformaciones = new ArrayList<>();
                    if (padreEraHijo) {
                        transformaciones.add("padre convertido de hijo a padre");
                    }
                    if (padreTeníaHijos) {
                        transformaciones.add("hijos del padre desasociados");
                    }
                    if (hijoTeníaPadre) {
                        transformaciones.add("hijo desasociado de su padre anterior");
                    }
                    if (hijoEraPadre) {
                        transformaciones.add("hijo convertido de padre a hijo");
                    }
                    mensaje.append(String.join(", ", transformaciones));
                    mensaje.append(")");
                }

                resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                        numeroGuiaPadre, numeroGuiaHijo, true,
                        mensaje.toString()));
                exitosas++;

            } catch (ResourceNotFoundException e) {
                resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                        numeroGuiaPadre, numeroGuiaHijo, false,
                        e.getMessage()));
                fallidas++;
            } catch (Exception e) {
                resultados.add(new AsociarClementinaLoteResultDTO.ResultadoAsociacion(
                        numeroGuiaPadre, numeroGuiaHijo, false,
                        "Error: " + e.getMessage()));
                fallidas++;
            }
        }

        AsociarClementinaLoteResultDTO resultado = new AsociarClementinaLoteResultDTO();
        resultado.setTotalAsociaciones(dto.getAsociaciones().size());
        resultado.setExitosas(exitosas);
        resultado.setFallidas(fallidas);
        resultado.setResultados(resultados);

        return resultado;
    }

    /**
     * Asocia una lista de guías hijas a una guía padre, marcando cada hijo como tipo CADENITA.
     */
    public AsociarCadenitaLoteResultDTO asociarCadenitaPorLote(AsociarCadenitaLoteDTO dto) {
        if (dto == null || dto.getNumeroGuiaPadre() == null || dto.getNumeroGuiaPadre().trim().isEmpty()) {
            throw new BadRequestException("El número de guía del padre es requerido");
        }
        if (dto.getNumeroGuiasHijos() == null || dto.getNumeroGuiasHijos().isEmpty()) {
            throw new BadRequestException("Debe proporcionar al menos una guía hijo");
        }

        String numeroGuiaPadreNorm = dto.getNumeroGuiaPadre().trim().toUpperCase();
        List<AsociarCadenitaLoteResultDTO.ResultadoCadenita> resultados = new ArrayList<>();
        int exitosas = 0;
        int fallidas = 0;

        Paquete paquetePadre = paqueteRepository.findByNumeroGuia(numeroGuiaPadreNorm)
                .orElse(null);

        if (paquetePadre == null) {
            for (String numeroGuiaHijo : dto.getNumeroGuiasHijos()) {
                String hijoNorm = numeroGuiaHijo != null ? numeroGuiaHijo.trim().toUpperCase() : "";
                if (hijoNorm.isEmpty()) {
                    resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(hijoNorm, false, "Guía vacía"));
                } else {
                    resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(hijoNorm, false,
                            "Guía padre no encontrada: " + numeroGuiaPadreNorm));
                }
                fallidas++;
            }
            return new AsociarCadenitaLoteResultDTO(
                    numeroGuiaPadreNorm,
                    dto.getNumeroGuiasHijos().size(),
                    0,
                    fallidas,
                    resultados);
        }

        for (String numeroGuiaHijo : dto.getNumeroGuiasHijos()) {
            String numeroGuiaHijoNorm = numeroGuiaHijo != null ? numeroGuiaHijo.trim().toUpperCase() : "";
            if (numeroGuiaHijoNorm.isEmpty()) {
                resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita("", false, "Guía vacía"));
                fallidas++;
                continue;
            }

            try {
                Paquete paqueteHijo = paqueteRepository.findByNumeroGuia(numeroGuiaHijoNorm)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Paquete con número de guía: " + numeroGuiaHijoNorm));

                if (paqueteHijo.getIdPaquete().equals(paquetePadre.getIdPaquete())) {
                    resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(
                            numeroGuiaHijoNorm, false, "Un paquete no puede ser hijo de sí mismo"));
                    fallidas++;
                    continue;
                }

                if (paqueteHijo.getPaquetePadre() != null) {
                    paqueteHijo.setPaquetePadre(null);
                    paqueteRepository.save(paqueteHijo);
                }
                paqueteHijo.setPaquetePadre(paquetePadre);
                paqueteHijo.setTipoPaquete(TipoPaquete.CADENITA);
                paqueteRepository.save(paqueteHijo);

                resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(
                        numeroGuiaHijoNorm, true, "Asociación exitosa"));
                exitosas++;
            } catch (ResourceNotFoundException e) {
                resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(
                        numeroGuiaHijoNorm, false, e.getMessage()));
                fallidas++;
            } catch (Exception e) {
                resultados.add(new AsociarCadenitaLoteResultDTO.ResultadoCadenita(
                        numeroGuiaHijoNorm, false, "Error: " + e.getMessage()));
                fallidas++;
            }
        }

        return new AsociarCadenitaLoteResultDTO(
                numeroGuiaPadreNorm,
                dto.getNumeroGuiasHijos().size(),
                exitosas,
                fallidas,
                resultados);
    }
}
