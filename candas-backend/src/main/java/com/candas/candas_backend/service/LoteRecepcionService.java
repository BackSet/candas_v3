package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoLote;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.LoteRecepcionSpecs;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import com.candas.candas_backend.util.ExcelDuplicateDetector;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class LoteRecepcionService {

    private final LoteRecepcionRepository loteRecepcionRepository;
    private final AgenciaRepository agenciaRepository;
    private final PaqueteRepository paqueteRepository;
    private final PaqueteService paqueteService;
    private final PaqueteNoEncontradoRepository paqueteNoEncontradoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgenciaScopeResolver agenciaScopeResolver;

    public LoteRecepcionService(
            LoteRecepcionRepository loteRecepcionRepository,
            AgenciaRepository agenciaRepository,
            PaqueteRepository paqueteRepository,
            PaqueteService paqueteService,
            PaqueteNoEncontradoRepository paqueteNoEncontradoRepository,
            UsuarioRepository usuarioRepository,
            AgenciaScopeResolver agenciaScopeResolver) {
        this.loteRecepcionRepository = loteRecepcionRepository;
        this.agenciaRepository = agenciaRepository;
        this.paqueteRepository = paqueteRepository;
        this.paqueteService = paqueteService;
        this.paqueteNoEncontradoRepository = paqueteNoEncontradoRepository;
        this.usuarioRepository = usuarioRepository;
        this.agenciaScopeResolver = agenciaScopeResolver;
    }

    private void assertLoteAccesible(LoteRecepcion lote) {
        agenciaScopeResolver.idAgenciaRestringida().ifPresent(idAg -> {
            if (lote.getAgencia() == null || !idAg.equals(lote.getAgencia().getIdAgencia())) {
                throw new AgenciaAccessDeniedException(construirMensajeAccesoLote(idAg, lote));
            }
        });
    }

    /** Valida que el lote exista y sea accesible para el usuario según alcance por agencia. */
    public void ensureLoteAccesible(Long idLoteRecepcion) {
        if (idLoteRecepcion == null) {
            return;
        }
        LoteRecepcion lote = loteRecepcionRepository.findById(idLoteRecepcion)
                .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(lote);
    }

    public Page<LoteRecepcionDTO> findAll(Pageable pageable) {
        Long idAg = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        if (idAg == null) {
            return loteRecepcionRepository.findAll(pageable).map(this::toDTO);
        }
        var spec = LoteRecepcionSpecs.withFilters(null, null, idAg);
        return loteRecepcionRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public Page<LoteRecepcionDTO> findAll(Pageable pageable, String search, TipoLote tipoLote) {
        Long idAg = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = LoteRecepcionSpecs.withFilters(search, tipoLote, idAg);
        return loteRecepcionRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public Page<LoteRecepcionDTO> findAllByTipoLote(TipoLote tipoLote, Pageable pageable) {
        Long idAg = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = LoteRecepcionSpecs.withFilters(null, tipoLote, idAg);
        return loteRecepcionRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public LoteRecepcionDTO findById(Long id) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", id));
        assertLoteAccesible(loteRecepcion);
        return toDTO(loteRecepcion);
    }

    public List<LoteRecepcionDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = loteRecepcionRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return loteRecepcionRepository.findAllByIdWithAgencia(ids).stream()
            .filter(l -> {
                try {
                    assertLoteAccesible(l);
                    return true;
                } catch (AgenciaAccessDeniedException e) {
                    return false;
                }
            })
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public List<LoteRecepcionDTO> searchByTipoLote(String query, TipoLote tipoLote) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = loteRecepcionRepository.searchIdsByTipoLote(query.trim(), tipoLote.name());
        if (ids.isEmpty()) {
            return List.of();
        }
        return loteRecepcionRepository.findAllByIdWithAgencia(ids).stream()
            .filter(l -> {
                try {
                    assertLoteAccesible(l);
                    return true;
                } catch (AgenciaAccessDeniedException e) {
                    return false;
                }
            })
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public LoteRecepcionDTO create(LoteRecepcionDTO dto) {
        Optional<Long> idAgenciaScopeCreacion = agenciaScopeResolver.requireAgenciaOrigenActivaParaCreacion();
        LoteRecepcion loteRecepcion = new LoteRecepcion();
        
        // Generar número de recepción si no se proporciona
        if (dto.getNumeroRecepcion() == null || dto.getNumeroRecepcion().trim().isEmpty()) {
            String numeroRecepcion = generarNumeroRecepcion();
            loteRecepcion.setNumeroRecepcion(numeroRecepcion);
        } else {
            loteRecepcion.setNumeroRecepcion(dto.getNumeroRecepcion().trim());
        }
        
        // Patrón de agencia origen activa: si viene por header, manda sobre el DTO.
        Long idAgenciaActiva = idAgenciaScopeCreacion.orElse(null);
        if (idAgenciaActiva != null) {
            if (dto.getIdAgencia() != null && !idAgenciaActiva.equals(dto.getIdAgencia())) {
                String agenciaUsuario = descripcionAgencia(agenciaRepository.findById(idAgenciaActiva).orElse(null), idAgenciaActiva);
                Agencia agenciaSolicitada = agenciaRepository.findById(dto.getIdAgencia()).orElse(null);
                String agenciaRecurso = descripcionAgencia(agenciaSolicitada, dto.getIdAgencia());
                throw new AgenciaAccessDeniedException("Tu entorno activo es " + agenciaUsuario
                        + ". Estás intentando crear un lote para " + agenciaRecurso
                        + ". Cambia de entorno para continuar.");
            }
            Agencia agencia = agenciaRepository.findById(idAgenciaActiva)
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", idAgenciaActiva));
            loteRecepcion.setAgencia(agencia);
        } else if (dto.getIdAgencia() != null) {
            Agencia agencia = agenciaRepository.findById(dto.getIdAgencia())
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
            loteRecepcion.setAgencia(agencia);
        } else {
            Optional<Usuario> usuarioOpt = obtenerUsuarioActual();
            if (usuarioOpt.isEmpty() || usuarioOpt.get().getAgencia() == null) {
                throw new AgenciaAccessDeniedException("El usuario no tiene agencia asignada para crear lotes.");
            }
            loteRecepcion.setAgencia(usuarioOpt.get().getAgencia());
        }
        
        loteRecepcion.setFechaRecepcion(dto.getFechaRecepcion());
        
        loteRecepcion.setUsuarioRegistro(resolverUsuarioRegistroActual(dto.getUsuarioRegistro()));
        
        loteRecepcion.setObservaciones(dto.getObservaciones());

        TipoLote tipo = parseTipoLote(dto.getTipoLote());
        loteRecepcion.setTipoLote(tipo);
        
        return toDTO(loteRecepcionRepository.save(loteRecepcion));
    }

    public LoteRecepcionDTO update(Long id, LoteRecepcionDTO dto) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", id));
        assertLoteAccesible(loteRecepcion);

        if (dto.getNumeroRecepcion() != null) {
            loteRecepcion.setNumeroRecepcion(dto.getNumeroRecepcion().trim());
        }
        
        Long idAgenciaActiva = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        if (idAgenciaActiva != null) {
            if (dto.getIdAgencia() != null && !idAgenciaActiva.equals(dto.getIdAgencia())) {
                String agenciaUsuario = descripcionAgencia(agenciaRepository.findById(idAgenciaActiva).orElse(null), idAgenciaActiva);
                Agencia agenciaSolicitada = agenciaRepository.findById(dto.getIdAgencia()).orElse(null);
                String agenciaRecurso = descripcionAgencia(agenciaSolicitada, dto.getIdAgencia());
                throw new AgenciaAccessDeniedException("Tu entorno activo es " + agenciaUsuario
                        + ". Estás intentando reasignar el lote a " + agenciaRecurso
                        + ". Cambia de entorno para continuar.");
            }
            Agencia agencia = agenciaRepository.findById(idAgenciaActiva)
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", idAgenciaActiva));
            loteRecepcion.setAgencia(agencia);
        } else if (dto.getIdAgencia() != null) {
            Agencia agencia = agenciaRepository.findById(dto.getIdAgencia())
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
            loteRecepcion.setAgencia(agencia);
        }
        
        if (dto.getFechaRecepcion() != null) {
            loteRecepcion.setFechaRecepcion(dto.getFechaRecepcion());
        }
        
        if (dto.getObservaciones() != null) {
            loteRecepcion.setObservaciones(dto.getObservaciones());
        }

        if (dto.getTipoLote() != null) {
            loteRecepcion.setTipoLote(parseTipoLote(dto.getTipoLote()));
        }
        
        return toDTO(loteRecepcionRepository.save(loteRecepcion));
    }

    public void delete(Long id) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", id));
        assertLoteAccesible(loteRecepcion);

        // Desasociar todos los paquetes del lote de recepción antes de eliminarlo
        // Esto evita que se eliminen los paquetes cuando se elimina el lote
        List<Paquete> paquetes = loteRecepcion.getPaquetes();
        if (paquetes != null && !paquetes.isEmpty()) {
            for (Paquete paquete : paquetes) {
                paquete.setLoteRecepcion(null);
                paqueteRepository.save(paquete);
            }
        }
        
        // Eliminar los paquetes no encontrados asociados a este lote
        List<PaqueteNoEncontrado> paquetesNoEncontrados = paqueteNoEncontradoRepository
            .findByLoteRecepcionIdLoteRecepcion(id);
        if (paquetesNoEncontrados != null && !paquetesNoEncontrados.isEmpty()) {
            paqueteNoEncontradoRepository.deleteAll(paquetesNoEncontrados);
        }
        
        // Ahora sí eliminar el lote de recepción
        loteRecepcionRepository.delete(loteRecepcion);
    }

    public void agregarPaquetes(Long idLoteRecepcion, List<Long> idPaquetes) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteRecepcion);

        for (Long idPaquete : idPaquetes) {
            Paquete paquete = paqueteRepository.findById(idPaquete)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));
            paquete.setLoteRecepcion(loteRecepcion);
            paquete.setEstado(EstadoPaquete.RECIBIDO);
            if (paquete.getFechaRecepcion() == null) {
                paquete.setFechaRecepcion(LocalDateTime.now());
            }
            paqueteRepository.save(paquete);
        }
    }

    public List<PaqueteDTO> obtenerPaquetes(Long idLoteRecepcion) {
        LoteRecepcion loteCheck = loteRecepcionRepository.findById(idLoteRecepcion)
                .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteCheck);

        // Obtener todos los paquetes asociados directamente al lote (estos son los padres)
        List<Paquete> paquetesDelLote = paqueteRepository.findByLoteRecepcionIdLoteRecepcion(idLoteRecepcion);
        
        // Obtener en una sola query todos los hijos de los paquetes CLEMENTINA del lote (evita N+1)
        List<Long> idsClementina = paquetesDelLote.stream()
            .filter(p -> p.getTipoPaquete() != null && p.getTipoPaquete() == TipoPaquete.CLEMENTINA)
            .map(Paquete::getIdPaquete)
            .filter(id -> id != null)
            .collect(Collectors.toList());
        List<Paquete> hijosClementina = idsClementina.isEmpty()
            ? List.of()
            : paqueteRepository.findByPaquetePadreIdPaqueteIn(idsClementina);
        
        // Combinar paquetes del lote (padres) con sus hijos CLEMENTINA
        List<Paquete> todosLosPaquetes = new ArrayList<>(paquetesDelLote);
        todosLosPaquetes.addAll(hijosClementina);
        
        return todosLosPaquetes.stream()
            .map(paqueteService::toDTO)
            .collect(Collectors.toList());
    }

    public LoteRecepcionImportResultDTO importarPaquetesDesdeExcel(Long idLoteRecepcion, MultipartFile file) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteRecepcion);

        LoteRecepcionImportResultDTO resultado = new LoteRecepcionImportResultDTO();
        List<String> numerosGuiaNoEncontrados = new ArrayList<>();
        List<PaqueteDTO> paquetesAsociados = new ArrayList<>();
        List<PaqueteNoImportadoDTO> paquetesNoImportados = new ArrayList<>();
        List<String> numerosGuiaDuplicados = new ArrayList<>();
        int totalRegistros = 0;
        int paquetesEncontrados = 0;
        
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // Primera pasada: detectar duplicados dentro del archivo
            ExcelDuplicateDetector.DuplicateDetectionResult duplicateResult = 
                ExcelDuplicateDetector.detectarDuplicados(
                    sheet,
                    0, // Columna A (número de guía)
                    1, // Fila de inicio (después de header)
                    this::getCellValueAsString
                );
            
            Map<String, List<Integer>> numerosGuiaPorFila = duplicateResult.getNumerosGuiaPorFila();
            numerosGuiaDuplicados.addAll(duplicateResult.getNumerosGuiaDuplicados());
            paquetesNoImportados.addAll(duplicateResult.getPaquetesNoImportados());
            
            // Segunda pasada: procesar números de guía válidos
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                Cell cell = row.getCell(0);
                if (cell == null) continue;
                
                String numeroGuia = getCellValueAsString(cell);
                if (numeroGuia == null || numeroGuia.trim().isEmpty()) continue;
                
                totalRegistros++;
                numeroGuia = numeroGuia.trim();
                
                // Saltar si es un duplicado (ya procesado) - comparación case-insensitive
                String numeroGuiaNormalizado = numeroGuia.toUpperCase();
                boolean esDuplicado = numerosGuiaDuplicados.stream()
                    .anyMatch(dup -> dup.toUpperCase().equals(numeroGuiaNormalizado));
                if (esDuplicado) {
                    List<Integer> filas = numerosGuiaPorFila.get(numeroGuiaNormalizado);
                    if (filas != null && filas.size() > 1 && filas.get(0) != (i + 1)) {
                        continue; // Saltar esta fila, ya fue marcada como duplicado
                    }
                }
                
                // Buscar paquete por número de guía (case-insensitive)
                Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia).orElse(null);
                
                if (paquete == null) {
                    numerosGuiaNoEncontrados.add(numeroGuia);
                    PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
                    noImportado.setNumeroGuia(numeroGuia);
                    noImportado.setMotivo("Paquete no encontrado en el sistema");
                    noImportado.setNumeroFila(i + 1);
                    paquetesNoImportados.add(noImportado);
                    
                    // Guardar número de guía no encontrado en la base de datos
                    guardarPaqueteNoEncontrado(loteRecepcion, numeroGuia);
                } else {
                    // Validar si ya está asociado a otro lote
                    if (paquete.getLoteRecepcion() != null && !paquete.getLoteRecepcion().getIdLoteRecepcion().equals(idLoteRecepcion)) {
                        PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
                        noImportado.setNumeroGuia(numeroGuia);
                        noImportado.setMotivo("Paquete ya asociado a otro lote de recepción (Lote: " + paquete.getLoteRecepcion().getNumeroRecepcion() + ")");
                        noImportado.setNumeroFila(i + 1);
                        paquetesNoImportados.add(noImportado);
                    } 
                    // Validar si ya está en este lote
                    else if (paquete.getLoteRecepcion() != null && paquete.getLoteRecepcion().getIdLoteRecepcion().equals(idLoteRecepcion)) {
                        PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
                        noImportado.setNumeroGuia(numeroGuia);
                        noImportado.setMotivo("Paquete ya está en este lote de recepción");
                        noImportado.setNumeroFila(i + 1);
                        paquetesNoImportados.add(noImportado);
                    }
                    // Validar estado del paquete
                    else if (paquete.getEstado() == EstadoPaquete.DESPACHADO) {
                        PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
                        noImportado.setNumeroGuia(numeroGuia);
                        noImportado.setMotivo("Estado del paquete no permite asociarlo (Estado: DESPACHADO)");
                        noImportado.setNumeroFila(i + 1);
                        paquetesNoImportados.add(noImportado);
                    }
                    // Si pasa todas las validaciones, asociar el paquete
                    else {
                        paquete.setLoteRecepcion(loteRecepcion);
                        paquete.setEstado(EstadoPaquete.RECIBIDO);
                        if (paquete.getFechaRecepcion() == null) {
                            paquete.setFechaRecepcion(LocalDateTime.now());
                        }
                        paqueteRepository.save(paquete);
                        paquetesAsociados.add(paqueteService.toDTO(paquete));
                        paquetesEncontrados++;
                    }
                }
            }
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Error desconocido";
            throw new BadRequestException("Error al importar paquetes desde Excel: " + msg);
        }
        
        resultado.setTotalRegistros(totalRegistros);
        resultado.setPaquetesEncontrados(paquetesEncontrados);
        resultado.setPaquetesNoEncontrados(numerosGuiaNoEncontrados.size());
        resultado.setNumerosGuiaNoEncontrados(numerosGuiaNoEncontrados);
        resultado.setPaquetesAsociados(paquetesAsociados);
        resultado.setPaquetesNoImportados(paquetesNoImportados);
        resultado.setNumerosGuiaDuplicados(numerosGuiaDuplicados);
        
        return resultado;
    }

    public LoteRecepcionImportResultDTO agregarPaquetesPorNumeroGuia(Long idLoteRecepcion, List<String> numerosGuia) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteRecepcion);

        LoteRecepcionImportResultDTO resultado = new LoteRecepcionImportResultDTO();
        List<String> numerosGuiaNoEncontrados = new ArrayList<>();
        List<PaqueteDTO> paquetesAsociados = new ArrayList<>();
        int totalRegistros = numerosGuia.size();
        int paquetesEncontrados = 0;
        
        for (String numeroGuia : numerosGuia) {
            if (numeroGuia == null || numeroGuia.trim().isEmpty()) continue;
            
            // Buscar paquete por número de guía (case-insensitive)
            Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia.trim()).orElse(null);
            
            if (paquete != null) {
                paquete.setLoteRecepcion(loteRecepcion);
                paquete.setEstado(EstadoPaquete.RECIBIDO);
                if (paquete.getFechaRecepcion() == null) {
                    paquete.setFechaRecepcion(LocalDateTime.now());
                }
                paqueteRepository.save(paquete);
                paquetesAsociados.add(paqueteService.toDTO(paquete));
                paquetesEncontrados++;
            } else {
                numerosGuiaNoEncontrados.add(numeroGuia.trim());
                // Guardar número de guía no encontrado en la base de datos
                guardarPaqueteNoEncontrado(loteRecepcion, numeroGuia.trim());
            }
        }
        
        resultado.setTotalRegistros(totalRegistros);
        resultado.setPaquetesEncontrados(paquetesEncontrados);
        resultado.setPaquetesNoEncontrados(numerosGuiaNoEncontrados.size());
        resultado.setNumerosGuiaNoEncontrados(numerosGuiaNoEncontrados);
        resultado.setPaquetesAsociados(paquetesAsociados);
        
        return resultado;
    }

    public LoteRecepcionImportResultDTO agregarHijosClementinaALote(Long idLoteRecepcion, Long idPaquetePadre, List<Long> idPaquetesHijos) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteRecepcion);

        // Asignar los hijos al padre CLEMENTINA usando el servicio de paquetes
        List<PaqueteDTO> hijosAsignados = paqueteService.asignarHijosAClementina(idPaquetePadre, idPaquetesHijos);
        
        // Asociar los hijos al lote de recepción y establecer estado RECIBIDO
        LocalDateTime fechaRecepcion = LocalDateTime.now();
        List<PaqueteDTO> paquetesAgregados = new ArrayList<>();
        
        for (PaqueteDTO hijoDTO : hijosAsignados) {
            Paquete paqueteHijo = paqueteRepository.findById(hijoDTO.getIdPaquete())
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", hijoDTO.getIdPaquete()));
            
            // Asociar al lote de recepción
            paqueteHijo.setLoteRecepcion(loteRecepcion);
            paqueteHijo.setEstado(EstadoPaquete.RECIBIDO);
            if (paqueteHijo.getFechaRecepcion() == null) {
                paqueteHijo.setFechaRecepcion(fechaRecepcion);
            }
            
            paqueteRepository.save(paqueteHijo);
            paquetesAgregados.add(paqueteService.toDTO(paqueteHijo));
        }
        
        // Crear resultado
        LoteRecepcionImportResultDTO resultado = new LoteRecepcionImportResultDTO();
        resultado.setTotalRegistros(idPaquetesHijos.size());
        resultado.setPaquetesEncontrados(paquetesAgregados.size());
        resultado.setPaquetesNoEncontrados(0);
        resultado.setNumerosGuiaNoEncontrados(new ArrayList<>());
        resultado.setPaquetesAsociados(paquetesAgregados);
        resultado.setPaquetesNoImportados(new ArrayList<>());
        resultado.setNumerosGuiaDuplicados(new ArrayList<>());
        
        return resultado;
    }

    public LoteRecepcionImportResultDTO agregarHijoClementinaPorGuiaALote(Long idLoteRecepcion, Long idPaquetePadre, String numeroGuia) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(loteRecepcion);

        // Asignar el hijo al padre CLEMENTINA usando el servicio de paquetes
        PaqueteDTO hijoAsignado = paqueteService.asignarHijoPorNumeroGuia(idPaquetePadre, numeroGuia);
        
        // Asociar el hijo al lote de recepción y establecer estado RECIBIDO
        LocalDateTime fechaRecepcion = LocalDateTime.now();
        Paquete paqueteHijo = paqueteRepository.findById(hijoAsignado.getIdPaquete())
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", hijoAsignado.getIdPaquete()));
        
        // Asociar al lote de recepción
        paqueteHijo.setLoteRecepcion(loteRecepcion);
        paqueteHijo.setEstado(EstadoPaquete.RECIBIDO);
        if (paqueteHijo.getFechaRecepcion() == null) {
            paqueteHijo.setFechaRecepcion(fechaRecepcion);
        }
        
        paqueteRepository.save(paqueteHijo);
        PaqueteDTO paqueteAgregado = paqueteService.toDTO(paqueteHijo);
        
        // Crear resultado
        LoteRecepcionImportResultDTO resultado = new LoteRecepcionImportResultDTO();
        resultado.setTotalRegistros(1);
        resultado.setPaquetesEncontrados(1);
        resultado.setPaquetesNoEncontrados(0);
        resultado.setNumerosGuiaNoEncontrados(new ArrayList<>());
        resultado.setPaquetesAsociados(List.of(paqueteAgregado));
        resultado.setPaquetesNoImportados(new ArrayList<>());
        resultado.setNumerosGuiaDuplicados(new ArrayList<>());
        
        return resultado;
    }

    public LoteRecepcionEstadisticasDTO obtenerEstadisticas(Long idLoteRecepcion) {
        LoteRecepcion lote = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(lote);

        Long totalPaquetes = loteRecepcionRepository.countPaquetesByLoteRecepcion(idLoteRecepcion);
        Long paquetesDespachados = loteRecepcionRepository.countPaquetesDespachadosByLoteRecepcion(idLoteRecepcion);
        
        int total = totalPaquetes != null ? totalPaquetes.intValue() : 0;
        int despachados = paquetesDespachados != null ? paquetesDespachados.intValue() : 0;
        int pendientes = total - despachados;
        
        BigDecimal porcentajeCompletado = total > 0 
            ? BigDecimal.valueOf(despachados)
                .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;
        
        LoteRecepcionEstadisticasDTO estadisticas = new LoteRecepcionEstadisticasDTO();
        estadisticas.setTotalPaquetes(total);
        estadisticas.setPaquetesDespachados(despachados);
        estadisticas.setPaquetesPendientes(pendientes);
        estadisticas.setPorcentajeCompletado(porcentajeCompletado);
        
        return estadisticas;
    }

    private String generarNumeroRecepcion() {
        String fecha = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefijo = "REC-" + fecha + "-";
        
        List<LoteRecepcion> base = agenciaScopeResolver.idAgenciaRestringida()
                .map(idAg -> loteRecepcionRepository.findAll(LoteRecepcionSpecs.withFilters(null, null, idAg)))
                .orElseGet(loteRecepcionRepository::findAll);
        List<LoteRecepcion> recepcionesDelDia = base.stream()
            .filter(r -> r.getNumeroRecepcion() != null && r.getNumeroRecepcion().startsWith(prefijo))
            .sorted((r1, r2) -> {
                String num1 = r1.getNumeroRecepcion().substring(prefijo.length());
                String num2 = r2.getNumeroRecepcion().substring(prefijo.length());
                return Integer.compare(Integer.parseInt(num2), Integer.parseInt(num1));
            })
            .collect(Collectors.toList());
        
        int siguienteNumero = 1;
        if (!recepcionesDelDia.isEmpty()) {
            String ultimoNumero = recepcionesDelDia.get(0).getNumeroRecepcion().substring(prefijo.length());
            siguienteNumero = Integer.parseInt(ultimoNumero) + 1;
        }
        
        return prefijo + String.format("%03d", siguienteNumero);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                // Convertir número a string sin decimales si es entero
                double numericValue = cell.getNumericCellValue();
                if (numericValue == (long) numericValue) {
                    yield String.valueOf((long) numericValue);
                }
                yield String.valueOf(numericValue);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
    }

    public List<PaqueteNoEncontradoDTO> obtenerPaquetesNoEncontrados(Long idLoteRecepcion) {
        LoteRecepcion lote = loteRecepcionRepository.findById(idLoteRecepcion)
                .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        assertLoteAccesible(lote);

        List<PaqueteNoEncontrado> paquetesNoEncontrados = paqueteNoEncontradoRepository
            .findByLoteRecepcionIdLoteRecepcion(idLoteRecepcion);
        
        return paquetesNoEncontrados.stream()
            .map(this::toPaqueteNoEncontradoDTO)
            .collect(Collectors.toList());
    }

    private void guardarPaqueteNoEncontrado(LoteRecepcion loteRecepcion, String numeroGuia) {
        // Verificar si ya existe para evitar duplicados (case-insensitive)
        List<PaqueteNoEncontrado> existentes = paqueteNoEncontradoRepository
            .findByLoteRecepcionIdLoteRecepcion(loteRecepcion.getIdLoteRecepcion());
        
        String numeroGuiaNormalizado = numeroGuia.toUpperCase();
        boolean yaExiste = existentes.stream()
            .anyMatch(p -> p.getNumeroGuia() != null && p.getNumeroGuia().toUpperCase().equals(numeroGuiaNormalizado));
        
        if (!yaExiste) {
            PaqueteNoEncontrado paqueteNoEncontrado = new PaqueteNoEncontrado();
            paqueteNoEncontrado.setLoteRecepcion(loteRecepcion);
            paqueteNoEncontrado.setNumeroGuia(numeroGuia);
            
            paqueteNoEncontrado.setUsuarioRegistro(resolverUsuarioRegistroActual(null));
            
            paqueteNoEncontradoRepository.save(paqueteNoEncontrado);
        }
    }

    private PaqueteNoEncontradoDTO toPaqueteNoEncontradoDTO(PaqueteNoEncontrado paqueteNoEncontrado) {
        PaqueteNoEncontradoDTO dto = new PaqueteNoEncontradoDTO();
        dto.setIdPaqueteNoEncontrado(paqueteNoEncontrado.getIdPaqueteNoEncontrado());
        dto.setIdLoteRecepcion(paqueteNoEncontrado.getLoteRecepcion().getIdLoteRecepcion());
        dto.setNumeroGuia(paqueteNoEncontrado.getNumeroGuia());
        dto.setFechaRegistro(paqueteNoEncontrado.getFechaRegistro());
        dto.setUsuarioRegistro(nombreVisibleUsuario(paqueteNoEncontrado.getUsuarioRegistro()));
        return dto;
    }

    private Usuario resolverUsuarioRegistroActual(String usernameFallback) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String username = authentication.getName();
                if (username != null && !username.isBlank() && !"anonymousUser".equals(username)) {
                    return usuarioRepository.findByUsername(username).orElse(null);
                }
            }
        } catch (Exception ignored) {
            // Sin usuario autenticado, se usa fallback.
        }
        if (usernameFallback != null && !usernameFallback.isBlank()) {
            return usuarioRepository.findByUsername(usernameFallback.trim()).orElse(null);
        }
        return null;
    }

    /**
     * Obtiene el usuario autenticado actual (con agencia cargada por EntityGraph).
     */
    private Optional<Usuario> obtenerUsuarioActual() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String username = authentication.getName();
                if (username != null && !username.isEmpty() && !username.equals("anonymousUser")) {
                    return usuarioRepository.findByUsername(username);
                }
            }
        } catch (Exception e) {
            // Retornar vacío si hay error
        }
        return Optional.empty();
    }

    private static TipoLote parseTipoLote(String value) {
        if (value == null || value.trim().isEmpty()) {
            return TipoLote.NORMAL;
        }
        try {
            return TipoLote.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return TipoLote.NORMAL;
        }
    }

    private String construirMensajeAccesoLote(Long idAgenciaUsuario, LoteRecepcion lote) {
        String agenciaUsuario = descripcionAgencia(agenciaRepository.findById(idAgenciaUsuario).orElse(null), idAgenciaUsuario);
        String agenciaRecurso = descripcionAgencia(lote.getAgencia());
        return "Tu usuario pertenece a la " + agenciaUsuario
                + ". El lote solicitado pertenece a " + agenciaRecurso
                + ". No tienes acceso a estos datos mientras no inicies sesión con un usuario de esa agencia.";
    }

    private String descripcionAgencia(Agencia agencia) {
        if (agencia == null) {
            return "agencia no identificada";
        }
        if (agencia.getCodigo() != null && !agencia.getCodigo().isBlank()) {
            return "agencia \"" + agencia.getNombre() + "\" (código " + agencia.getCodigo() + ")";
        }
        return "agencia \"" + agencia.getNombre() + "\"";
    }

    private String descripcionAgencia(Agencia agencia, Long idAgenciaFallback) {
        if (agencia != null) {
            return descripcionAgencia(agencia);
        }
        return idAgenciaFallback != null
                ? "agencia con id " + idAgenciaFallback
                : "agencia no identificada";
    }

    private LoteRecepcionDTO toDTO(LoteRecepcion loteRecepcion) {
        LoteRecepcionDTO dto = new LoteRecepcionDTO();
        dto.setIdLoteRecepcion(loteRecepcion.getIdLoteRecepcion());
        dto.setTipoLote(loteRecepcion.getTipoLote() != null ? loteRecepcion.getTipoLote().name() : TipoLote.NORMAL.name());
        dto.setNumeroRecepcion(loteRecepcion.getNumeroRecepcion());
        
        if (loteRecepcion.getAgencia() != null) {
            dto.setIdAgencia(loteRecepcion.getAgencia().getIdAgencia());
            dto.setNombreAgencia(loteRecepcion.getAgencia().getNombre());
            dto.setCantonAgencia(loteRecepcion.getAgencia().getCanton());
        }
        
        dto.setFechaRecepcion(loteRecepcion.getFechaRecepcion());
        dto.setUsuarioRegistro(nombreVisibleUsuario(loteRecepcion.getUsuarioRegistro()));
        dto.setObservaciones(loteRecepcion.getObservaciones());
        
        // Calcular estadísticas
        Long totalPaquetes = loteRecepcionRepository.countPaquetesByLoteRecepcion(loteRecepcion.getIdLoteRecepcion());
        Long paquetesDespachados = loteRecepcionRepository.countPaquetesDespachadosByLoteRecepcion(loteRecepcion.getIdLoteRecepcion());
        
        int total = totalPaquetes != null ? totalPaquetes.intValue() : 0;
        int despachados = paquetesDespachados != null ? paquetesDespachados.intValue() : 0;
        int pendientes = total - despachados;
        
        BigDecimal porcentajeCompletado = total > 0 
            ? BigDecimal.valueOf(despachados)
                .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;
        
        dto.setTotalPaquetes(total);
        dto.setPaquetesDespachados(despachados);
        dto.setPaquetesPendientes(pendientes);
        dto.setPorcentajeCompletado(porcentajeCompletado);
        
        return dto;
    }

    private String nombreVisibleUsuario(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        if (usuario.getNombreCompleto() != null && !usuario.getNombreCompleto().isBlank()) {
            return usuario.getNombreCompleto();
        }
        return usuario.getUsername();
    }

}
