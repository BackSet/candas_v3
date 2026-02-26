package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoLote;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.LoteRecepcionSpecs;
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

    public LoteRecepcionService(
            LoteRecepcionRepository loteRecepcionRepository,
            AgenciaRepository agenciaRepository,
            PaqueteRepository paqueteRepository,
            PaqueteService paqueteService,
            PaqueteNoEncontradoRepository paqueteNoEncontradoRepository,
            UsuarioRepository usuarioRepository) {
        this.loteRecepcionRepository = loteRecepcionRepository;
        this.agenciaRepository = agenciaRepository;
        this.paqueteRepository = paqueteRepository;
        this.paqueteService = paqueteService;
        this.paqueteNoEncontradoRepository = paqueteNoEncontradoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Page<LoteRecepcionDTO> findAll(Pageable pageable) {
        return loteRecepcionRepository.findAll(pageable).map(this::toDTO);
    }

    public Page<LoteRecepcionDTO> findAll(Pageable pageable, String search, TipoLote tipoLote) {
        var spec = LoteRecepcionSpecs.withFilters(search, tipoLote);
        return loteRecepcionRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public Page<LoteRecepcionDTO> findAllByTipoLote(TipoLote tipoLote, Pageable pageable) {
        return loteRecepcionRepository.findByTipoLote(tipoLote, pageable).map(this::toDTO);
    }

    public LoteRecepcionDTO findById(Long id) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", id));
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
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public LoteRecepcionDTO create(LoteRecepcionDTO dto) {
        LoteRecepcion loteRecepcion = new LoteRecepcion();
        
        // Generar número de recepción si no se proporciona
        if (dto.getNumeroRecepcion() == null || dto.getNumeroRecepcion().trim().isEmpty()) {
            String numeroRecepcion = generarNumeroRecepcion();
            loteRecepcion.setNumeroRecepcion(numeroRecepcion);
        } else {
            loteRecepcion.setNumeroRecepcion(dto.getNumeroRecepcion().trim());
        }
        
        // Agencia: del DTO o de la agencia asignada al usuario autenticado
        if (dto.getIdAgencia() != null) {
            Agencia agencia = agenciaRepository.findById(dto.getIdAgencia())
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
            loteRecepcion.setAgencia(agencia);
        } else {
            Optional<Usuario> usuarioOpt = obtenerUsuarioActual();
            if (usuarioOpt.isEmpty() || usuarioOpt.get().getAgencia() == null) {
                throw new BadRequestException("Debe indicar la agencia en el lote o asignar una agencia al usuario");
            }
            loteRecepcion.setAgencia(usuarioOpt.get().getAgencia());
        }
        
        loteRecepcion.setFechaRecepcion(dto.getFechaRecepcion());
        
        // Obtener nombre completo del usuario del contexto de seguridad
        // Siempre usar el nombre completo del usuario autenticado, ignorar el valor del DTO
        String usuarioRegistro = obtenerNombreCompletoUsuario();
        if (usuarioRegistro == null || usuarioRegistro.isEmpty()) {
            // Si no se puede obtener el nombre completo, intentar obtenerlo del DTO
            // pero si el DTO tiene un username, buscar el nombre completo
            if (dto.getUsuarioRegistro() != null && !dto.getUsuarioRegistro().isEmpty()) {
                // Intentar buscar si es un username
                usuarioRegistro = usuarioRepository.findByUsername(dto.getUsuarioRegistro())
                    .map(Usuario::getNombreCompleto)
                    .orElse(dto.getUsuarioRegistro());
            } else {
                usuarioRegistro = "system";
            }
        }
        loteRecepcion.setUsuarioRegistro(usuarioRegistro);
        
        loteRecepcion.setObservaciones(dto.getObservaciones());

        TipoLote tipo = parseTipoLote(dto.getTipoLote());
        loteRecepcion.setTipoLote(tipo);
        
        return toDTO(loteRecepcionRepository.save(loteRecepcion));
    }

    public LoteRecepcionDTO update(Long id, LoteRecepcionDTO dto) {
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", id));
        
        if (dto.getNumeroRecepcion() != null) {
            loteRecepcion.setNumeroRecepcion(dto.getNumeroRecepcion().trim());
        }
        
        if (dto.getIdAgencia() != null) {
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
        // Verificar que el lote de recepción existe
        if (!loteRecepcionRepository.existsById(idLoteRecepcion)) {
            throw new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion);
        }
        
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
        // Verificar que el lote de recepción existe
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        
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
        // Verificar que el lote de recepción existe
        LoteRecepcion loteRecepcion = loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        
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
        // Verificar que el lote de recepción existe
        loteRecepcionRepository.findById(idLoteRecepcion)
            .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        
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
        
        List<LoteRecepcion> recepcionesDelDia = loteRecepcionRepository.findAll().stream()
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
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Convertir número a string sin decimales si es entero
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    public List<PaqueteNoEncontradoDTO> obtenerPaquetesNoEncontrados(Long idLoteRecepcion) {
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
            
            // Obtener nombre completo del usuario del contexto de seguridad
            String usuarioRegistro = obtenerNombreCompletoUsuario();
            if (usuarioRegistro == null || usuarioRegistro.isEmpty()) {
                usuarioRegistro = "system";
            }
            paqueteNoEncontrado.setUsuarioRegistro(usuarioRegistro);
            
            paqueteNoEncontradoRepository.save(paqueteNoEncontrado);
        }
    }

    private PaqueteNoEncontradoDTO toPaqueteNoEncontradoDTO(PaqueteNoEncontrado paqueteNoEncontrado) {
        PaqueteNoEncontradoDTO dto = new PaqueteNoEncontradoDTO();
        dto.setIdPaqueteNoEncontrado(paqueteNoEncontrado.getIdPaqueteNoEncontrado());
        dto.setIdLoteRecepcion(paqueteNoEncontrado.getLoteRecepcion().getIdLoteRecepcion());
        dto.setNumeroGuia(paqueteNoEncontrado.getNumeroGuia());
        dto.setFechaRegistro(paqueteNoEncontrado.getFechaRegistro());
        dto.setUsuarioRegistro(paqueteNoEncontrado.getUsuarioRegistro());
        return dto;
    }

    /**
     * Obtiene el nombre completo del usuario autenticado desde el contexto de seguridad
     * @return El nombre completo del usuario o null si no está autenticado o no se encuentra
     */
    private String obtenerNombreCompletoUsuario() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                String username = authentication.getName();
                if (username != null && !username.isEmpty() && !username.equals("anonymousUser")) {
                    Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(username);
                    if (usuarioOpt.isPresent()) {
                        return usuarioOpt.get().getNombreCompleto();
                    }
                }
            }
        } catch (Exception e) {
            // Si hay algún error, retornar null
            e.printStackTrace();
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
        dto.setUsuarioRegistro(loteRecepcion.getUsuarioRegistro());
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

}
