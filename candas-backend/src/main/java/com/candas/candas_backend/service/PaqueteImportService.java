package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.ImportResultDTO;
import com.candas.candas_backend.dto.PaqueteDTO;
import com.candas.candas_backend.dto.PaqueteNoImportadoDTO;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.entity.enums.TipoDestino;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.mapper.PaqueteMapper;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.util.ExcelDuplicateDetector;
import com.candas.candas_backend.util.ExcelHelper;
import com.candas.candas_backend.validation.PaqueteValidator;
import org.springframework.dao.DataIntegrityViolationException;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaqueteImportService {

    private final PaqueteService paqueteService;
    private final PaqueteMapper paqueteMapper;
    private final PaqueteValidator paqueteValidator;
    private final ClienteRepository clienteRepository;
    private final PuntoOrigenRepository puntoOrigenRepository;
    private final AgenciaRepository agenciaRepository;
    private final PaqueteRepository paqueteRepository;

    public PaqueteImportService(
            PaqueteService paqueteService,
            PaqueteMapper paqueteMapper,
            PaqueteValidator paqueteValidator,
            ClienteRepository clienteRepository,
            PuntoOrigenRepository puntoOrigenRepository,
            AgenciaRepository agenciaRepository,
            PaqueteRepository paqueteRepository) {
        this.paqueteService = paqueteService;
        this.paqueteMapper = paqueteMapper;
        this.paqueteValidator = paqueteValidator;
        this.clienteRepository = clienteRepository;
        this.puntoOrigenRepository = puntoOrigenRepository;
        this.agenciaRepository = agenciaRepository;
        this.paqueteRepository = paqueteRepository;
    }

    // Mapas en memoria para optimizar búsquedas
    private Map<String, Agencia> agenciasPorNombre;
    private Map<String, Agencia> agenciasPorCodigo;
    private Map<String, PuntoOrigen> puntosOrigenPorNombre;

    public ImportResultDTO importarDesdeExcel(MultipartFile file) {
        ImportResultDTO resultado = new ImportResultDTO();
        List<String> errores = new ArrayList<>();
        List<PaqueteDTO> paquetesCreados = new ArrayList<>();
        List<PaqueteNoImportadoDTO> paquetesNoImportados = new ArrayList<>();
        List<String> numerosGuiaDuplicados = new ArrayList<>();
        ContadoresImportacion contadores = new ContadoresImportacion();

        try (InputStream inputStream = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);

            String numeroMaster = validarYLeerNumeroMaster(sheet, errores, resultado);
            if (numeroMaster == null) {
                return resultado;
            }

            cargarEntidadesEnMemoria();

            ExcelDuplicateDetector.DuplicateDetectionResult duplicateResult = detectarDuplicadosEnArchivo(sheet);

            Map<String, List<Integer>> numerosGuiaPorFila = duplicateResult.getNumerosGuiaPorFila();
            numerosGuiaDuplicados.addAll(duplicateResult.getNumerosGuiaDuplicados());
            paquetesNoImportados.addAll(duplicateResult.getPaquetesNoImportados());

            procesarFilas(sheet, numeroMaster, numerosGuiaPorFila, numerosGuiaDuplicados,
                    errores, paquetesCreados, paquetesNoImportados, contadores);

        } catch (Exception e) {
            manejarErrorImportacion(e, errores);
        } finally {
            establecerResultado(resultado, contadores, errores, paquetesCreados,
                    paquetesNoImportados, numerosGuiaDuplicados);
        }

        return resultado;
    }

    /**
     * FUNCIÓN TEMPORAL: Importa y actualiza paquetes desde Excel.
     */
    @Transactional
    public ImportResultDTO importarYActualizarDesdeExcel(MultipartFile file) {
        ImportResultDTO resultado = new ImportResultDTO();
        List<String> errores = new ArrayList<>();
        List<PaqueteDTO> paquetesCreados = new ArrayList<>();
        List<PaqueteNoImportadoDTO> paquetesNoImportados = new ArrayList<>();
        ContadoresImportacion contadores = new ContadoresImportacion();

        try (InputStream inputStream = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);

            String numeroMaster = validarYLeerNumeroMaster(sheet, errores, resultado);
            if (numeroMaster == null) {
                return resultado;
            }

            cargarEntidadesEnMemoria();

            // Procesar filas (empezar desde fila 2, después de headers)
            for (int i = 2; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || ExcelHelper.isRowEmpty(row)) {
                    continue;
                }

                contadores.totalRegistros++;
                procesarFilaActualizarPaquete(row, numeroMaster, i + 1, errores,
                        paquetesCreados, paquetesNoImportados, contadores);
            }

        } catch (Exception e) {
            manejarErrorImportacion(e, errores);
        } finally {
            establecerResultado(resultado, contadores, errores, paquetesCreados,
                    paquetesNoImportados, new ArrayList<>());
        }

        return resultado;
    }

    private void procesarFilaActualizarPaquete(Row row, String numeroMaster, int numeroFila,
            List<String> errores, List<PaqueteDTO> paquetesActualizados,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        try {
            String numeroGuia = extraerNumeroGuia(row);
            if (numeroGuia == null || numeroGuia.trim().isEmpty()) {
                contadores.registrosFallidos++;
                agregarPaqueteNoImportado(null, "Número de guía es obligatorio", numeroFila, paquetesNoImportados);
                return;
            }

            // Buscar paquete existente por número de guía (case-insensitive)
            Optional<Paquete> paqueteExistenteOpt = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia.trim());

            // Guardar referencias a clientes actuales ANTES de procesar la fila
            Cliente clienteRemitenteAnterior = null;
            Cliente clienteDestinatarioAnterior = null;
            if (paqueteExistenteOpt.isPresent()) {
                clienteRemitenteAnterior = paqueteExistenteOpt.get().getClienteRemitente();
                clienteDestinatarioAnterior = paqueteExistenteOpt.get().getClienteDestinatario();
            }

            // Procesar fila para obtener DTO con datos del Excel (esto crea los nuevos
            // clientes)
            PaqueteDTO paqueteDTO = procesarFila(row, numeroMaster, errores);
            if (paqueteDTO == null) {
                contadores.registrosFallidos++;
                agregarPaqueteNoImportado(numeroGuia, "Error al procesar datos de la fila", numeroFila,
                        paquetesNoImportados);
                return;
            }

            Paquete paquete;

            if (paqueteExistenteOpt.isPresent()) {
                // Actualizar paquete existente
                paquete = paqueteExistenteOpt.get();

                // Actualizar campos del paquete usando el mapper
                paqueteMapper.updateEntityFromDTO(paquete, paqueteDTO);
            } else {
                // Crear nuevo paquete
                paquete = paqueteMapper.toEntity(paqueteDTO);
                paquete.setFechaRegistro(LocalDateTime.now());
            }

            // Validar y guardar paquete primero
            paqueteValidator.validatePaquete(paquete);
            Paquete paqueteGuardado = paqueteRepository.save(paquete);

            // Eliminar clientes anteriores DESPUÉS de guardar el paquete
            eliminarClienteSiEsPosible(clienteRemitenteAnterior, errores, numeroFila);
            eliminarClienteSiEsPosible(clienteDestinatarioAnterior, errores, numeroFila);

            paquetesActualizados.add(paqueteMapper.toDTO(paqueteGuardado));
            contadores.registrosExitosos++;

        } catch (Exception e) {
            contadores.registrosFallidos++;
            String errorMsg = e.getMessage();
            if (e.getCause() != null) {
                errorMsg += " - Causa: " + e.getCause().getMessage();
            }
            errores.add("Fila " + numeroFila + ": " + errorMsg);
            String numeroGuia = extraerNumeroGuia(row);
            agregarPaqueteNoImportado(numeroGuia, "Error: " + errorMsg, numeroFila, paquetesNoImportados);
        }
    }

    private void eliminarClienteSiEsPosible(Cliente cliente, List<String> errores, int numeroFila) {
        if (cliente == null) {
            return;
        }

        try {
            // Intentar eliminar físicamente
            clienteRepository.delete(cliente);
        } catch (Exception e) {
            // Si falla por constraint (cliente asociado a otros paquetes), solo registrar
            // advertencia
            errores.add("Fila " + numeroFila + ": No se pudo eliminar cliente " + cliente.getNombreCompleto() +
                    " (ID: " + cliente.getIdCliente() + ") - puede estar asociado a otros paquetes. " + e.getMessage());
        }
    }

    private static class ContadoresImportacion {
        int totalRegistros = 0;
        int registrosExitosos = 0;
        int registrosFallidos = 0;
    }

    private String leerNumeroMaster(Sheet sheet, List<String> errores) {
        try {
            Row masterRow = sheet.getRow(0);
            if (masterRow == null) return null;
            Cell masterCell = masterRow.getCell(0);
            if (masterCell == null) return null;
            String numeroMaster = ExcelHelper.getCellValueAsString(masterCell);
            return (numeroMaster != null) ? numeroMaster.trim() : null;
        } catch (Exception e) {
            errores.add("Error al leer el número master de A1: " + e.getMessage());
            return null;
        }
    }

    /**
     * Lee el número master de la celda A1 y valida que exista. Si no es válido, rellena resultado y retorna null.
     */
    private String validarYLeerNumeroMaster(Sheet sheet, List<String> errores, ImportResultDTO resultado) {
        String numeroMaster = leerNumeroMaster(sheet, errores);
        if (numeroMaster == null || numeroMaster.isEmpty()) {
            errores.add(
                    "No se encontró el número master en A1 (NUMERO MASTER PAQUETE). Asegúrate de que el Excel tenga el formato correcto.");
            resultado.setTotalRegistros(0);
            resultado.setRegistrosExitosos(0);
            resultado.setRegistrosFallidos(0);
            resultado.setErrores(errores);
            resultado.setPaquetesCreados(new ArrayList<>());
            return null;
        }
        return numeroMaster;
    }

    private ExcelDuplicateDetector.DuplicateDetectionResult detectarDuplicadosEnArchivo(Sheet sheet) {
        return ExcelDuplicateDetector.detectarDuplicados(
                sheet,
                0, // Columna A (HAW)
                2, // Fila de inicio (después de headers)
                ExcelHelper::getCellValueAsString);
    }

    private void procesarFilas(Sheet sheet, String numeroMaster, Map<String, List<Integer>> numerosGuiaPorFila,
            List<String> numerosGuiaDuplicados, List<String> errores,
            List<PaqueteDTO> paquetesCreados, List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        for (int i = 2; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || ExcelHelper.isRowEmpty(row)) {
                continue;
            }

            String numeroGuia = extraerNumeroGuia(row);
            if (debeSaltarFila(numeroGuia, numerosGuiaDuplicados, numerosGuiaPorFila, i)) {
                continue;
            }

            contadores.totalRegistros++;
            procesarFilaPaquete(row, numeroMaster, numeroGuia, i + 1, errores,
                    paquetesCreados, paquetesNoImportados, contadores);
        }
    }

    private String extraerNumeroGuia(Row row) {
        String hawb = ExcelHelper.getCellValueAsStringSafe(row, 0);
        return (hawb != null && !hawb.trim().isEmpty()) ? hawb.trim() : null;
    }

    private boolean debeSaltarFila(String numeroGuia, List<String> numerosGuiaDuplicados,
            Map<String, List<Integer>> numerosGuiaPorFila, int filaIndex) {
        if (numeroGuia == null || !numerosGuiaDuplicados.contains(numeroGuia)) {
            return false;
        }

        List<Integer> filas = numerosGuiaPorFila.get(numeroGuia);
        return filas != null && filas.size() > 1 && filas.get(0) != (filaIndex + 1);
    }

    private void procesarFilaPaquete(Row row, String numeroMaster, String numeroGuia, int numeroFila,
            List<String> errores, List<PaqueteDTO> paquetesCreados,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        try {
            if (paqueteYaExiste(numeroGuia, numeroFila, paquetesNoImportados, contadores)) {
                return;
            }

            PaqueteDTO paqueteDTO = procesarFila(row, numeroMaster, errores);
            if (paqueteDTO != null) {
                crearPaqueteConManejoErrores(paqueteDTO, numeroFila, paquetesCreados,
                        paquetesNoImportados, contadores);
            } else {
                registrarErrorProcesamiento(numeroGuia, numeroFila, paquetesNoImportados, contadores);
            }
        } catch (Exception e) {
            manejarErrorFila(e, numeroGuia, numeroFila, errores, paquetesNoImportados, contadores);
        }
    }

    private boolean paqueteYaExiste(String numeroGuia, int numeroFila,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        if (numeroGuia == null || !paqueteRepository.findByNumeroGuia(numeroGuia).isPresent()) {
            return false;
        }

        contadores.registrosFallidos++;
        agregarPaqueteNoImportado(numeroGuia, "Paquete ya existe en el sistema", numeroFila, paquetesNoImportados);
        return true;
    }

    private void crearPaqueteConManejoErrores(PaqueteDTO paqueteDTO, int numeroFila,
            List<PaqueteDTO> paquetesCreados,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        try {
            PaqueteDTO paqueteCreado = crearPaqueteEnTransaccion(paqueteDTO);
            paquetesCreados.add(paqueteCreado);
            contadores.registrosExitosos++;
        } catch (DataIntegrityViolationException e) {
            registrarErrorDuplicado(paqueteDTO, numeroFila, e, paquetesNoImportados, contadores);
        } catch (BadRequestException e) {
            registrarErrorValidacion(paqueteDTO, numeroFila, e, paquetesNoImportados, contadores);
        } catch (Exception e) {
            registrarErrorCreacion(paqueteDTO, numeroFila, e, paquetesNoImportados, contadores);
        }
    }

    private void registrarErrorDuplicado(PaqueteDTO paqueteDTO, int numeroFila, DataIntegrityViolationException e,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        contadores.registrosFallidos++;
        String motivo = "Número de guía duplicado";
        if (e.getMessage() != null && e.getMessage().contains("numero_guia")) {
            motivo = "Número de guía duplicado en la base de datos";
        }
        agregarPaqueteNoImportado(paqueteDTO.getNumeroGuia(), motivo, numeroFila, paquetesNoImportados);
    }

    private void registrarErrorValidacion(PaqueteDTO paqueteDTO, int numeroFila, BadRequestException e,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        contadores.registrosFallidos++;
        String motivo = e.getMessage() != null ? e.getMessage() : "Error de validación";
        agregarPaqueteNoImportado(paqueteDTO.getNumeroGuia(), motivo, numeroFila, paquetesNoImportados);
    }

    private void registrarErrorCreacion(PaqueteDTO paqueteDTO, int numeroFila, Exception e,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        contadores.registrosFallidos++;
        String errorMsg = e.getMessage();
        if (e.getCause() != null) {
            errorMsg += " - Causa: " + e.getCause().getMessage();
        }
        agregarPaqueteNoImportado(paqueteDTO.getNumeroGuia(), "Error al crear paquete: " + errorMsg,
                numeroFila, paquetesNoImportados);
    }

    private void registrarErrorProcesamiento(String numeroGuia, int numeroFila,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        contadores.registrosFallidos++;
        if (numeroGuia != null) {
            agregarPaqueteNoImportado(numeroGuia, "Error al procesar la fila (ver errores generales)",
                    numeroFila, paquetesNoImportados);
        }
    }

    private void manejarErrorFila(Exception e, String numeroGuia, int numeroFila, List<String> errores,
            List<PaqueteNoImportadoDTO> paquetesNoImportados,
            ContadoresImportacion contadores) {
        contadores.registrosFallidos++;
        String errorMsg = e.getMessage();
        if (e.getCause() != null) {
            errorMsg += " - Causa: " + e.getCause().getMessage();
        }
        errores.add("Fila " + numeroFila + ": " + errorMsg);
        if (numeroGuia != null) {
            agregarPaqueteNoImportado(numeroGuia, "Error al procesar: " + errorMsg,
                    numeroFila, paquetesNoImportados);
        }
    }

    private void agregarPaqueteNoImportado(String numeroGuia, String motivo, int numeroFila,
            List<PaqueteNoImportadoDTO> paquetesNoImportados) {
        PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
        noImportado.setNumeroGuia(numeroGuia);
        noImportado.setMotivo(motivo);
        noImportado.setNumeroFila(numeroFila);
        paquetesNoImportados.add(noImportado);
    }

    private void manejarErrorImportacion(Exception e, List<String> errores) {
        String errorMessage = "Error al procesar el archivo: " + e.getMessage();
        if (e.getCause() != null) {
            errorMessage += " - Causa: " + e.getCause().getMessage();
        }
        errores.add(errorMessage);
        e.printStackTrace(); // Log para debugging
    }

    private void establecerResultado(ImportResultDTO resultado, ContadoresImportacion contadores,
            List<String> errores, List<PaqueteDTO> paquetesCreados,
            List<PaqueteNoImportadoDTO> paquetesNoImportados, List<String> numerosGuiaDuplicados) {
        resultado.setTotalRegistros(contadores.totalRegistros);
        resultado.setRegistrosExitosos(contadores.registrosExitosos);
        resultado.setRegistrosFallidos(contadores.registrosFallidos);
        resultado.setErrores(errores);
        resultado.setPaquetesCreados(paquetesCreados);
        resultado.setPaquetesNoImportados(paquetesNoImportados);
        resultado.setNumerosGuiaDuplicados(numerosGuiaDuplicados);
    }

    private void cargarEntidadesEnMemoria() {
        // Inicializar mapas
        agenciasPorNombre = new HashMap<>();
        agenciasPorCodigo = new HashMap<>();
        puntosOrigenPorNombre = new HashMap<>();

        // Cargar agencias
        List<Agencia> agencias = agenciaRepository.findAll();
        for (Agencia agencia : agencias) {
            if (agencia.getNombre() != null && !agencia.getNombre().trim().isEmpty()) {
                agenciasPorNombre.put(agencia.getNombre().trim().toLowerCase(), agencia);
            }
            if (agencia.getCodigo() != null && !agencia.getCodigo().trim().isEmpty()) {
                agenciasPorCodigo.put(agencia.getCodigo().trim().toLowerCase(), agencia);
            }
        }

        // Cargar puntos de origen
        List<PuntoOrigen> puntosOrigen = puntoOrigenRepository.findAll();
        for (PuntoOrigen puntoOrigen : puntosOrigen) {
            if (puntoOrigen.getNombrePuntoOrigen() != null && !puntoOrigen.getNombrePuntoOrigen().trim().isEmpty()) {
                puntosOrigenPorNombre.put(puntoOrigen.getNombrePuntoOrigen().trim().toLowerCase(), puntoOrigen);
            }
        }
    }

    private PaqueteDTO procesarFila(Row row, String numeroMaster, List<String> errores) {
        int numeroFila = row.getRowNum() + 1;
        try {
            // Leer valores de las celdas usando ExcelHelper
            String hawb = ExcelHelper.getCellValueAsStringSafe(row, 0);
            String service = ExcelHelper.getCellValueAsStringSafe(row, 3);

            // Cliente REMITENTE
            String shipper = ExcelHelper.getCellValueAsStringSafe(row, 4);
            String idNumberShipper = ExcelHelper.getCellValueAsStringSafe(row, 6);
            String countryRemitente = ExcelHelper.getCellValueAsStringSafe(row, 7);
            String stateRemitente = ExcelHelper.getCellValueAsStringSafe(row, 8);
            String cityRemitente = ExcelHelper.getCellValueAsStringSafe(row, 9);
            String addressRemitente = ExcelHelper.getCellValueAsStringSafe(row, 11);

            // Cliente DESTINATARIO
            String consignne = ExcelHelper.getCellValueAsStringSafe(row, 13);
            String idNumberConsignne = ExcelHelper.getCellValueAsStringSafe(row, 15);
            String countryDestinatario = ExcelHelper.getCellValueAsStringSafe(row, 16);
            String stateDestinatario = ExcelHelper.getCellValueAsStringSafe(row, 17);
            String cityDestinatario = ExcelHelper.getCellValueAsStringSafe(row, 18);
            String addressDestinatario = ExcelHelper.getCellValueAsStringSafe(row, 19);
            String cellPhone = ExcelHelper.getCellValueAsStringSafe(row, 21);

            String sed = ExcelHelper.getCellValueAsStringSafe(row, 23);
            String medidas = ExcelHelper.getCellValueAsStringSafe(row, 26);
            String lbs = ExcelHelper.getCellValueAsStringSafe(row, 27);
            String kgs = ExcelHelper.getCellValueAsStringSafe(row, 28);
            String description = ExcelHelper.getCellValueAsStringSafe(row, 32);
            String note = ExcelHelper.getCellValueAsStringSafe(row, 33);
            String value = ExcelHelper.getCellValueAsStringSafe(row, 34);
            String tariffPosition = ExcelHelper.getCellValueAsStringSafe(row, 35);
            String agenciaOficina = ExcelHelper.getCellValueAsStringSafe(row, 36);

            // Validar campos obligatorios
            if (hawb == null || hawb.trim().isEmpty()) {
                errores.add("Fila " + numeroFila + ": HAW (GUIA PAQUETE) es obligatorio");
                return null;
            }

            if (shipper == null || shipper.trim().isEmpty()) {
                errores.add("Fila " + numeroFila + ": SHIPPER (NOMBRE REMITENTE) es obligatorio");
                return null;
            }

            // Crear Cliente Remitente NUEVO
            Cliente clienteRemitente = crearClienteNuevo(
                    shipper, idNumberShipper, null, null, countryRemitente, stateRemitente, cityRemitente,
                    addressRemitente);

            // Buscar o crear Cliente Destinatario
            Cliente clienteDestinatario = null;
            if (consignne != null && !consignne.trim().isEmpty()) {
                clienteDestinatario = crearClienteNuevo(
                        consignne, idNumberConsignne, null, cellPhone, countryDestinatario, stateDestinatario, cityDestinatario,
                        addressDestinatario);
            }

            // Buscar o crear PuntoOrigen
            PuntoOrigen puntoOrigen = null;
            if (agenciaOficina != null && !agenciaOficina.trim().isEmpty()) {
                puntoOrigen = buscarOcrearPuntoOrigen(agenciaOficina.trim());
            } else if (cityRemitente != null && !cityRemitente.trim().isEmpty() &&
                    stateRemitente != null && !stateRemitente.trim().isEmpty() &&
                    countryRemitente != null && !countryRemitente.trim().isEmpty()) {
                String nombreOrigen = String.format("%s - %s, %s", cityRemitente, stateRemitente, countryRemitente);
                puntoOrigen = buscarOcrearPuntoOrigen(nombreOrigen);
            }

            TipoPaquete tipoPaquete = mapearServiceATipoPaquete(service);
            TipoDestino tipoDestino = mapearServiceATipoDestino(service);

            // Crear DTO del paquete
            PaqueteDTO paqueteDTO = new PaqueteDTO();
            paqueteDTO.setNumeroGuia(hawb.trim());
            paqueteDTO.setNumeroMaster(numeroMaster);
            paqueteDTO.setTipoPaquete(tipoPaquete);
            paqueteDTO.setTipoDestino(tipoDestino);
            paqueteDTO.setEstado(EstadoPaquete.REGISTRADO);
            paqueteDTO.setIdClienteRemitente(clienteRemitente.getIdCliente());

            // Agregar información de dirección del remitente al DTO
            paqueteDTO.setPaisRemitente(clienteRemitente.getPais());
            paqueteDTO.setCiudadRemitente(clienteRemitente.getCiudad());
            paqueteDTO.setCantonRemitente(clienteRemitente.getCanton());
            paqueteDTO.setDireccionRemitente(clienteRemitente.getDireccion());
            paqueteDTO.setDireccionRemitenteCompleta(construirDireccionCompleta(
                    clienteRemitente.getDireccion(), clienteRemitente.getCanton(), clienteRemitente.getCiudad(),
                    clienteRemitente.getPais()));

            if (clienteDestinatario != null) {
                paqueteDTO.setIdClienteDestinatario(clienteDestinatario.getIdCliente());
                paqueteDTO.setPaisDestinatario(clienteDestinatario.getPais());
                paqueteDTO.setCiudadDestinatario(clienteDestinatario.getCiudad());
                paqueteDTO.setCantonDestinatario(clienteDestinatario.getCanton());
                paqueteDTO.setDireccionDestinatario(clienteDestinatario.getDireccion());
                paqueteDTO.setDireccionDestinatarioCompleta(construirDireccionCompleta(
                        clienteDestinatario.getDireccion(), clienteDestinatario.getCanton(),
                        clienteDestinatario.getCiudad(), clienteDestinatario.getPais()));
                paqueteDTO.setTelefonoDestinatario(clienteDestinatario.getTelefono());
            }

            if (puntoOrigen != null) {
                paqueteDTO.setIdPuntoOrigen(puntoOrigen.getIdPuntoOrigen());
            }

            paqueteDTO.setSed(sed);
            paqueteDTO.setMedidas(medidas);

            if (lbs != null && !lbs.trim().isEmpty()) {
                try {
                    paqueteDTO.setPesoLibras(new BigDecimal(lbs.trim()));
                } catch (NumberFormatException e) {
                    errores.add("Fila " + numeroFila + ": Lbs tiene formato inválido: " + lbs);
                }
            }

            if (kgs != null && !kgs.trim().isEmpty()) {
                try {
                    paqueteDTO.setPesoKilos(new BigDecimal(kgs.trim()));
                } catch (NumberFormatException e) {
                    errores.add("Fila " + numeroFila + ": Kgs tiene formato inválido: " + kgs);
                }
            }

            paqueteDTO.setDescripcion(description);
            paqueteDTO.setObservaciones(note);

            if (value != null && !value.trim().isEmpty()) {
                try {
                    paqueteDTO.setValor(new BigDecimal(value.trim()));
                } catch (NumberFormatException e) {
                    errores.add("Fila " + numeroFila + ": VALUE tiene formato inválido: " + value);
                }
            }

            paqueteDTO.setTarifaPosition(tariffPosition);

            return paqueteDTO;

        } catch (Exception e) {
            errores.add("Fila " + numeroFila + ": " + e.getMessage());
            return null;
        }
    }

    private Cliente crearClienteNuevo(
            String nombre, String numeroDocumento, String email, String telefono,
            String pais, String ciudad, String canton, String direccion) {
        Cliente cliente = new Cliente();
        cliente.setNombreCompleto((nombre == null || nombre.trim().isEmpty()) ? "Sin nombre" : nombre.trim());
        cliente.setDocumentoIdentidad(
                (numeroDocumento == null || numeroDocumento.trim().isEmpty()) ? null : numeroDocumento.trim());
        cliente.setEmail((email == null || email.trim().isEmpty()) ? null : email.trim());
        cliente.setTelefono((telefono == null || telefono.trim().isEmpty()) ? null : telefono.trim());
        cliente.setPais((pais == null || pais.trim().isEmpty()) ? null : pais.trim());
        cliente.setCiudad((ciudad == null || ciudad.trim().isEmpty()) ? null : ciudad.trim());
        cliente.setCanton((canton == null || canton.trim().isEmpty()) ? null : canton.trim());
        cliente.setDireccion((direccion == null || direccion.trim().isEmpty()) ? null : direccion.trim());
        cliente.setFechaRegistro(LocalDateTime.now());
        cliente.setActivo(true);
        return clienteRepository.save(cliente);
    }

    private String construirDireccionCompleta(String direccion, String canton, String ciudad, String pais) {
        List<String> partes = new ArrayList<>();
        if (direccion != null && !direccion.trim().isEmpty()) {
            partes.add(direccion.trim());
        }
        if (canton != null && !canton.trim().isEmpty()) {
            partes.add(canton.trim());
        }
        if (ciudad != null && !ciudad.trim().isEmpty()) {
            partes.add(ciudad.trim());
        }
        if (pais != null && !pais.trim().isEmpty()) {
            partes.add(pais.trim());
        }
        return partes.isEmpty() ? null : String.join(", ", partes);
    }

    private PuntoOrigen buscarOcrearPuntoOrigen(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return null;
        }

        String nombreLower = nombre.trim().toLowerCase();
        PuntoOrigen puntoOrigenEncontrado = puntosOrigenPorNombre.get(nombreLower);

        if (puntoOrigenEncontrado != null) {
            return puntoOrigenEncontrado;
        }

        for (Map.Entry<String, PuntoOrigen> entry : puntosOrigenPorNombre.entrySet()) {
            String nombreExistente = entry.getKey();
            if (nombreLower.contains(nombreExistente) || nombreExistente.contains(nombreLower)) {
                int longitudMinima = Math.min(nombreLower.length(), nombreExistente.length());
                int longitudMaxima = Math.max(nombreLower.length(), nombreExistente.length());
                if (longitudMinima * 2 >= longitudMaxima) {
                    return entry.getValue();
                }
            }
        }

        PuntoOrigen nuevoPuntoOrigen = new PuntoOrigen();
        nuevoPuntoOrigen.setNombrePuntoOrigen(nombre.trim());
        nuevoPuntoOrigen.setActivo(true);
        nuevoPuntoOrigen = puntoOrigenRepository.save(nuevoPuntoOrigen);
        puntosOrigenPorNombre.put(nombreLower, nuevoPuntoOrigen);

        return nuevoPuntoOrigen;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private PaqueteDTO crearPaqueteEnTransaccion(PaqueteDTO dto) {
        return paqueteService.create(dto);
    }

    private TipoPaquete mapearServiceATipoPaquete(String service) {
        if (service == null || service.trim().isEmpty()) {
            return null;
        }

        String serviceUpper = service.trim().toUpperCase();

        if (serviceUpper.contains("CLEMENTINA") || serviceUpper.contains("CLEM")) {
            return TipoPaquete.CLEMENTINA;
        } else if (serviceUpper.contains("SEPARAR") || serviceUpper.contains("SEP")) {
            return TipoPaquete.SEPARAR;
        } else if (serviceUpper.contains("CADENITA") || serviceUpper.contains("CAD")) {
            return TipoPaquete.CADENITA;
        } else if (serviceUpper.contains("DIRECTO") || serviceUpper.contains("DIR")) {
            // Este es un caso por defecto si no encaja en los otros
            return null;
        }

        return null;
    }

    private TipoDestino mapearServiceATipoDestino(String service) {
        if (service == null || service.trim().isEmpty()) {
            return null;
        }

        String serviceUpper = service.trim().toUpperCase();

        if (serviceUpper.contains("AGENCIA") || serviceUpper.contains("AGE")) {
            return TipoDestino.AGENCIA;
        } else if (serviceUpper.contains("DOMICILIO") || serviceUpper.contains("DOM")) {
            return TipoDestino.DOMICILIO;
        }

        return null;
    }
}
