package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.CambiarTipoMasivoDTO;
import com.candas.candas_backend.dto.GuiaRefDTO;
import com.candas.candas_backend.dto.ImportResultDTO;
import com.candas.candas_backend.dto.PaqueteDTO;
import com.candas.candas_backend.dto.PaqueteRapidoDTO;
import com.candas.candas_backend.dto.PaqueteSimplificadoDTO;
import com.candas.candas_backend.dto.PaqueteEstadisticasDTO;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.mapper.PaqueteMapper;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.PaqueteSpecs;
import com.candas.candas_backend.util.ExcelHelper;
import com.candas.candas_backend.util.ListasEtiquetadasConstants;
import com.candas.candas_backend.validation.PaqueteValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaqueteService {

    private final PaqueteRepository paqueteRepository;
    private final ClienteRepository clienteRepository;
    private final PaqueteMapper paqueteMapper;
    private final PaqueteValidator paqueteValidator;

    public PaqueteService(
            PaqueteRepository paqueteRepository,
            ClienteRepository clienteRepository,
            PaqueteMapper paqueteMapper,
            PaqueteValidator paqueteValidator) {
        this.paqueteRepository = paqueteRepository;
        this.clienteRepository = clienteRepository;
        this.paqueteMapper = paqueteMapper;
        this.paqueteValidator = paqueteValidator;
    }

    public Page<PaqueteDTO> findAll(String search, EstadoPaquete estado, TipoPaquete tipo, Pageable pageable) {
        return findAll(search, estado, tipo, null, null, null, null, pageable);
    }

public Page<PaqueteDTO> findAll(
            String search,
            EstadoPaquete estado,
            TipoPaquete tipo,
            Long idAgencia,
            Long idLote,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta,
            Pageable pageable) {
        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        
        // Usar Specifications para evitar problemas con parámetros null en JPQL
        Specification<Paquete> spec = PaqueteSpecs.withFilters(
                searchTrimmed, estado, tipo, idAgencia, idLote, fechaDesde, fechaHasta);
        
        return paqueteRepository.findAll(spec, pageable).map(paqueteMapper::toDTO);
    }

    public PaqueteDTO findById(Long id) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));
        return paqueteMapper.toDTO(paquete);
    }

    public PaqueteDTO findByNumeroGuia(String numeroGuia) {
        Paquete paquete = paqueteRepository.findByNumeroGuia(numeroGuia)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete con número de guía: " + numeroGuia));
        return paqueteMapper.toDTO(paquete);
    }

    public PaqueteDTO create(PaqueteDTO dto) {
        Paquete paquete = paqueteMapper.toEntity(dto);
        paquete.setFechaRegistro(LocalDateTime.now());
        paquete.setEstado(EstadoPaquete.REGISTRADO);

        // Validaciones de negocio
        paqueteValidator.validatePaquete(paquete);

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    public PaqueteDTO crearPaqueteRapido(PaqueteRapidoDTO dto) {
        Paquete paquete = new Paquete();

        // Generar número de guía único
        String numeroGuia = "RAP-" + System.currentTimeMillis();
        paquete.setNumeroGuia(numeroGuia);

        paquete.setPesoKilos(dto.getPeso());
        paquete.setDescripcion(dto.getDescripcion());
        paquete.setObservaciones(dto.getDescripcion());
        paquete.setTipoPaquete(TipoPaquete.SEPARAR);
        paquete.setEstado(EstadoPaquete.REGISTRADO);
        paquete.setFechaRegistro(LocalDateTime.now());

        // Cliente Remitente por defecto
        Cliente clienteRemitente = clienteRepository.findFirstByActivoTrueOrderByIdClienteAsc()
                .orElseThrow(() -> new BadRequestException(
                        "No se encontró un cliente por defecto. Por favor, cree un cliente activo."));
        paquete.setClienteRemitente(clienteRemitente);

        // Usar etiquetaDestinatario para el nombre del destinatario
        paquete.setEtiquetaDestinatario(dto.getNombreDestinatario());

        // Aplicar defaults
        aplicarDefaultsListasEtiquetadas(paquete);

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    /**
     * Crea un paquete simplificado con solo número de guía y observación
     * Si el número de guía ya existe, actualiza solo la observación
     */
    public PaqueteDTO createSimplificado(PaqueteSimplificadoDTO dto) {
        // Normalizar número de guía
        String numeroGuiaNormalizado = dto.getNumeroGuia() != null
                ? dto.getNumeroGuia().trim().toUpperCase()
                : null;

        if (numeroGuiaNormalizado == null || numeroGuiaNormalizado.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }

        // Buscar si el paquete ya existe
        Paquete paquete = paqueteRepository.findByNumeroGuia(numeroGuiaNormalizado).orElse(null);

        if (paquete != null) {
            // Si existe, actualizar solo la observación si se proporciona
            if (dto.getObservaciones() != null) {
                paquete.setObservaciones(dto.getObservaciones());
            }
            return paqueteMapper.toDTO(paqueteRepository.save(paquete));
        }

        // Si no existe, crear nuevo paquete
        paquete = new Paquete();
        paquete.setNumeroGuia(numeroGuiaNormalizado);
        paquete.setObservaciones(dto.getObservaciones());
        paquete.setEstado(EstadoPaquete.REGISTRADO);
        paquete.setFechaRegistro(LocalDateTime.now());

        // Asignar remitente solo si se proporciona explícitamente.
        // En flujo simplificado se permite paquete sin remitente.
        if (dto.getIdClienteRemitente() != null) {
            Cliente clienteRemitente = clienteRepository.findById(dto.getIdClienteRemitente())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdClienteRemitente()));
            paquete.setClienteRemitente(clienteRemitente);
        } else {
            paquete.setClienteRemitente(null);
        }

        // No validar tipo de paquete para paquetes simplificados
        // (se puede asignar después)

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    /**
     * Crea múltiples paquetes simplificados
     */
    public List<PaqueteDTO> createSimplificadoBatch(List<PaqueteSimplificadoDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            throw new BadRequestException("La lista de paquetes no puede estar vacía");
        }

        List<PaqueteDTO> paquetesCreados = new ArrayList<>();

        for (PaqueteSimplificadoDTO dto : dtos) {
            paquetesCreados.add(createSimplificado(dto));
        }

        return paquetesCreados;
    }

    public PaqueteDTO update(Long id, PaqueteDTO dto) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));

        paqueteMapper.updateEntityFromDTO(paquete, dto);
        paqueteValidator.validatePaquete(paquete);

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    public void delete(Long id) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));
        paqueteRepository.delete(paquete);
    }

    public PaqueteDTO cambiarEstado(Long id, EstadoPaquete nuevoEstado) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));

        paquete.setEstado(nuevoEstado);

        // Actualizar fechas según el estado
        if (nuevoEstado == EstadoPaquete.RECIBIDO && paquete.getFechaRecepcion() == null) {
            paquete.setFechaRecepcion(LocalDateTime.now());
        } else if (nuevoEstado == EstadoPaquete.ENSACADO && paquete.getFechaEnsacado() == null) {
            paquete.setFechaEnsacado(LocalDateTime.now());
        }

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    public List<PaqueteDTO> cambiarTipoMasivo(CambiarTipoMasivoDTO dto) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            throw new BadRequestException("La lista de IDs no puede estar vacía");
        }

        if (dto.getNuevoTipo() == null) {
            throw new BadRequestException("El tipo de paquete es requerido");
        }

        // Validar que todos los IDs existan
        List<Paquete> paquetes = paqueteRepository.findAllById(dto.getIds());
        if (paquetes.size() != dto.getIds().size()) {
            List<Long> idsEncontrados = paquetes.stream()
                    .map(Paquete::getIdPaquete)
                    .collect(Collectors.toList());
            List<Long> idsNoEncontrados = dto.getIds().stream()
                    .filter(id -> !idsEncontrados.contains(id))
                    .collect(Collectors.toList());
            throw new ResourceNotFoundException("Paquetes no encontrados con IDs: " + idsNoEncontrados);
        }

        // Actualizar el tipo de todos los paquetes
        for (Paquete paquete : paquetes) {
            paquete.setTipoPaquete(dto.getNuevoTipo());
            // Validar el paquete después del cambio (sin requerir agencia para tipo AGENCIA
            // en cambio masivo)
            paqueteValidator.validatePaqueteParaCambioMasivo(paquete);
        }

        // Guardar todos los paquetes actualizados
        List<Paquete> paquetesActualizados = paqueteRepository.saveAll(paquetes);

        // Convertir a DTOs y retornar
        return paquetesActualizados.stream()
                .map(paqueteMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Helper method wrapper in case it's needed by PaqueteImportService or others
    // without circular dependency issues - kept for compatibility if needed
    public void validatePaquete(Paquete paquete) {
        paqueteValidator.validatePaquete(paquete);
    }

    // Explicit delegation for compatibility if needed by other services
    public Paquete toEntity(PaqueteDTO dto) {
        return paqueteMapper.toEntity(dto);
    }

    public void updateEntityFromDTO(Paquete paquete, PaqueteDTO dto) {
        paqueteMapper.updateEntityFromDTO(paquete, dto);
    }

    public PaqueteDTO toDTO(Paquete paquete) {
        return paqueteMapper.toDTO(paquete);
    }

    @Transactional
    public PaqueteDTO marcarEtiquetaCambiada(Long id) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));

        if (paquete.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
            throw new BadRequestException("Solo los paquetes tipo CLEMENTINA pueden marcar etiqueta cambiada");
        }

        paquete.setEtiquetaCambiada(true);
        paquete.setFechaEtiquetaCambiada(LocalDateTime.now());

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    @Transactional
    public PaqueteDTO marcarSeparado(Long id) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));

        if (paquete.getTipoPaquete() != TipoPaquete.SEPARAR) {
            throw new BadRequestException("Solo los paquetes tipo SEPARAR pueden marcar como separado");
        }

        paquete.setSeparado(true);
        paquete.setFechaSeparado(LocalDateTime.now());

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    @Transactional
    public PaqueteDTO marcarUnidoEnCaja(Long id) {
        Paquete paquete = paqueteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", id));

        if (paquete.getTipoPaquete() != TipoPaquete.CADENITA) {
            throw new BadRequestException("Solo los paquetes tipo CADENITA pueden marcar como unido en caja");
        }

        paquete.setUnidoEnCaja(true);
        paquete.setFechaUnidoEnCaja(LocalDateTime.now());

        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    /**
     * Importa REF desde Excel.
     * El Excel debe tener: Columna A = número de guía, Columna B = REF
     */
    @Transactional
    public ImportResultDTO importarRefDesdeExcel(MultipartFile file) {
        ImportResultDTO resultado = new ImportResultDTO();
        List<String> errores = new ArrayList<>();
        int registrosExitosos = 0;
        int registrosFallidos = 0;
        int totalRegistros = 0;

        try (InputStream inputStream = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);

            // Procesar filas (empezar desde la fila 1, asumiendo que la fila 0 puede ser
            // encabezado)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || ExcelHelper.isRowEmpty(row)) {
                    continue;
                }

                totalRegistros++;

                try {
                    // Columna A (0): número de guía
                    String numeroGuia = ExcelHelper.getCellValueAsStringSafe(row, 0);
                    // Columna B (1): REF
                    String ref = ExcelHelper.getCellValueAsStringSafe(row, 1);

                    if (numeroGuia == null || numeroGuia.trim().isEmpty()) {
                        errores.add("Fila " + (i + 1) + ": El número de guía es obligatorio");
                        registrosFallidos++;
                        continue;
                    }

                    // Buscar paquete por número de guía
                    Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia.trim())
                            .orElse(null);

                    if (paquete == null) {
                        errores.add("Fila " + (i + 1) + ": No se encontró paquete con número de guía: "
                                + numeroGuia.trim());
                        registrosFallidos++;
                        continue;
                    }

                    // Actualizar REF
                    paquete.setRef(ref != null && !ref.trim().isEmpty() ? ref.trim() : null);
                    paqueteRepository.save(paquete);
                    registrosExitosos++;

                } catch (Exception e) {
                    errores.add("Fila " + (i + 1) + ": Error al procesar - " + e.getMessage());
                    registrosFallidos++;
                }
            }

        } catch (Exception e) {
            errores.add("Error al procesar el archivo: " + e.getMessage());
            registrosFallidos = totalRegistros;
        }

        resultado.setTotalRegistros(totalRegistros);
        resultado.setRegistrosExitosos(registrosExitosos);
        resultado.setRegistrosFallidos(registrosFallidos);
        resultado.setErrores(errores);

        return resultado;
    }

    /**
     * Importa REF desde una lista de pares (numeroGuia, ref).
     * ref null o vacío = sin REF.
     */
    @Transactional
    public ImportResultDTO importarRefDesdeLista(List<GuiaRefDTO> pares) {
        ImportResultDTO resultado = new ImportResultDTO();
        List<String> errores = new ArrayList<>();
        int registrosExitosos = 0;
        int registrosFallidos = 0;
        int totalRegistros = 0;

        if (pares == null) {
            resultado.setTotalRegistros(0);
            resultado.setRegistrosExitosos(0);
            resultado.setRegistrosFallidos(0);
            resultado.setErrores(errores);
            return resultado;
        }

        for (int i = 0; i < pares.size(); i++) {
            GuiaRefDTO par = pares.get(i);
            String numeroGuia = par.getNumeroGuia() != null ? par.getNumeroGuia().trim() : "";
            String ref = par.getRef();

            if (numeroGuia.isEmpty()) {
                continue;
            }

            totalRegistros++;

            try {
                Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia).orElse(null);

                if (paquete == null) {
                    errores.add("Línea " + (i + 1) + ": No se encontró paquete con número de guía: " + numeroGuia);
                    registrosFallidos++;
                    continue;
                }

                paquete.setRef(ref != null && !ref.trim().isEmpty() ? ref.trim() : null);
                paqueteRepository.save(paquete);
                registrosExitosos++;
            } catch (Exception e) {
                errores.add("Línea " + (i + 1) + ": Error al procesar - " + e.getMessage());
                registrosFallidos++;
            }
        }

        resultado.setTotalRegistros(totalRegistros);
        resultado.setRegistrosExitosos(registrosExitosos);
        resultado.setRegistrosFallidos(registrosFallidos);
        resultado.setErrores(errores);

        return resultado;
    }

    @Transactional
    public List<PaqueteDTO> asignarHijosAClementina(Long idPaquetePadre, List<Long> idPaquetesHijos) {
        Paquete padre = paqueteRepository.findById(idPaquetePadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete padre", idPaquetePadre));

        if (padre.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
            throw new BadRequestException("El paquete padre debe ser de tipo CLEMENTINA");
        }

        List<Paquete> hijos = paqueteRepository.findAllById(idPaquetesHijos);
        if (hijos.size() != idPaquetesHijos.size()) {
            throw new ResourceNotFoundException("Uno o más paquetes hijos no encontrados");
        }

        List<PaqueteDTO> resultado = new ArrayList<>();
        for (Paquete hijo : hijos) {
            hijo.setPaquetePadre(padre);
            resultado.add(paqueteMapper.toDTO(paqueteRepository.save(hijo)));
        }

        return resultado;
    }

    @Transactional
    public PaqueteDTO asignarHijoPorNumeroGuia(Long idPaquetePadre, String numeroGuia) {
        Paquete padre = paqueteRepository.findById(idPaquetePadre)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete padre", idPaquetePadre));

        if (padre.getTipoPaquete() != TipoPaquete.CLEMENTINA) {
            throw new BadRequestException("El paquete padre debe ser de tipo CLEMENTINA");
        }

        Paquete hijo = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete hijo con guía: " + numeroGuia));

        hijo.setPaquetePadre(padre);
        return paqueteMapper.toDTO(paqueteRepository.save(hijo));
    }

    // ---------- Listas etiquetadas (GEO, MIA, etc.): flujo basado solo en Paquete ----------

    /**
     * Crea o actualiza un paquete desde el flujo de listas etiquetadas.
     * Datos genéricos por defecto; ref = etiqueta (o VARIAS); observaciones = "Tipo: X" o "Tipo: X, Y".
     * No exige cliente remitente para el flujo de listas especiales (MIAMI/GEO).
     */
    @Transactional
    public PaqueteDTO createOrUpdateFromListaEtiquetada(String numeroGuia, String etiquetaRef, String observacionesTipo) {
        String n = numeroGuia != null ? numeroGuia.trim().toUpperCase() : null;
        if (n == null || n.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(n).orElse(null);
        if (paquete != null) {
            paquete.setRef(etiquetaRef);
            paquete.setObservaciones(observacionesTipo);
            aplicarDefaultsListasEtiquetadasSiVacios(paquete);
            return paqueteMapper.toDTO(paqueteRepository.save(paquete));
        }
        paquete = new Paquete();
        paquete.setNumeroGuia(n);
        paquete.setRef(etiquetaRef);
        paquete.setObservaciones(observacionesTipo);
        paquete.setEstado(EstadoPaquete.REGISTRADO);
        paquete.setFechaRegistro(LocalDateTime.now());
        paquete.setClienteRemitente(null);
        aplicarDefaultsListasEtiquetadas(paquete);
        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    /**
     * Crea un paquete sin etiqueta (ref null) con datos genéricos, para clasificar después (ej. en lote especial).
     * No exige cliente remitente.
     */
    @Transactional
    public Paquete createPaqueteSinEtiqueta(String numeroGuia) {
        String n = numeroGuia != null ? numeroGuia.trim().toUpperCase() : null;
        if (n == null || n.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        if (paqueteRepository.findByNumeroGuiaIgnoreCase(n).isPresent()) {
            throw new BadRequestException("Ya existe un paquete con ese número de guía");
        }
        Paquete paquete = new Paquete();
        paquete.setNumeroGuia(n);
        paquete.setRef(null);
        paquete.setObservaciones(null);
        paquete.setEstado(EstadoPaquete.REGISTRADO);
        paquete.setFechaRegistro(LocalDateTime.now());
        paquete.setClienteRemitente(null);
        aplicarDefaultsListasEtiquetadas(paquete);
        return paqueteRepository.save(paquete);
    }

    /**
     * Actualiza ref y observaciones cuando el operario elige la etiqueta para una guía en varias listas.
     */
    @Transactional
    public PaqueteDTO updateRefYObservacionesFromListaEtiquetada(String numeroGuia, String etiquetaElegida) {
        String n = numeroGuia != null ? numeroGuia.trim().toUpperCase() : null;
        if (n == null || n.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        if (etiquetaElegida == null || etiquetaElegida.trim().isEmpty()) {
            throw new BadRequestException("La etiqueta elegida es obligatoria");
        }
        String etiqueta = etiquetaElegida.trim().toUpperCase();
        Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(n)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró paquete con número de guía: " + numeroGuia));
        paquete.setRef(etiqueta);
        paquete.setObservaciones("Tipo: " + etiqueta);
        return paqueteMapper.toDTO(paqueteRepository.save(paquete));
    }

    private void aplicarDefaultsListasEtiquetadas(Paquete p) {
        p.setPesoKilos(ListasEtiquetadasConstants.PESO_KILOS_DEFAULT);
        p.setPesoLibras(ListasEtiquetadasConstants.PESO_LIBRAS_DEFAULT);
        p.setMedidas(ListasEtiquetadasConstants.MEDIDAS_DEFAULT);
        p.setValor(ListasEtiquetadasConstants.VALOR_DEFAULT);
        p.setTarifaPosition(ListasEtiquetadasConstants.TARIFA_POSITION_DEFAULT);
        p.setSed(ListasEtiquetadasConstants.SED_DEFAULT);
    }

    private void aplicarDefaultsListasEtiquetadasSiVacios(Paquete p) {
        if (p.getPesoKilos() == null) p.setPesoKilos(ListasEtiquetadasConstants.PESO_KILOS_DEFAULT);
        if (p.getPesoLibras() == null) p.setPesoLibras(ListasEtiquetadasConstants.PESO_LIBRAS_DEFAULT);
        if (p.getMedidas() == null || p.getMedidas().isBlank()) p.setMedidas(ListasEtiquetadasConstants.MEDIDAS_DEFAULT);
        if (p.getValor() == null) p.setValor(ListasEtiquetadasConstants.VALOR_DEFAULT);
        if (p.getTarifaPosition() == null || p.getTarifaPosition().isBlank()) p.setTarifaPosition(ListasEtiquetadasConstants.TARIFA_POSITION_DEFAULT);
        if (p.getSed() == null || p.getSed().isBlank()) p.setSed(ListasEtiquetadasConstants.SED_DEFAULT);
    }

    public PaqueteEstadisticasDTO getEstadisticas() {
        long total = paqueteRepository.countTotal();
        long registrados = paqueteRepository.countByEstado(EstadoPaquete.REGISTRADO);
        long recibidos = paqueteRepository.countByEstado(EstadoPaquete.RECIBIDO);
        long ensacados = paqueteRepository.countByEstado(EstadoPaquete.ENSACADO);
        long despachados = paqueteRepository.countByEstado(EstadoPaquete.DESPACHADO);
        return new PaqueteEstadisticasDTO(total, registrados, recibidos, ensacados, despachados);
    }
}
