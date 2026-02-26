package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.entity.LoteRecepcion;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TipoLote;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.LoteRecepcionRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import com.candas.candas_backend.util.ListasEtiquetadasConstants;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ListasEtiquetadasService {

    private static final String PREFIJO_TIPO = "Tipo: ";
    private static final String PREFIJO_INSTRUCCION = " Instrucción:";

    /**
     * Extrae la parte " Instrucción: ..." de las observaciones (desde la primera ocurrencia hasta el final).
     * Si no hay instrucción, devuelve cadena vacía.
     */
    private static String extraerParteInstruccion(String observaciones) {
        if (observaciones == null || observaciones.isBlank()) return "";
        int idx = observaciones.indexOf(PREFIJO_INSTRUCCION);
        if (idx == -1) return "";
        return observaciones.substring(idx).trim();
    }

    private final PaqueteRepository paqueteRepository;
    private final PaqueteService paqueteService;
    private final LoteRecepcionRepository loteRecepcionRepository;

    public ListasEtiquetadasService(
            PaqueteRepository paqueteRepository,
            PaqueteService paqueteService,
            LoteRecepcionRepository loteRecepcionRepository) {
        this.paqueteRepository = paqueteRepository;
        this.paqueteService = paqueteService;
        this.loteRecepcionRepository = loteRecepcionRepository;
    }

    public ListasEtiquetadasBatchResultDTO createBatch(ListasEtiquetadasBatchRequest request) {
        String etiqueta = request.getEtiqueta().trim().toUpperCase();
        List<String> numeros = request.getNumerosGuia().stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toUpperCase())
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        if (numeros.isEmpty()) {
            throw new BadRequestException("Debe incluir al menos un número de guía");
        }
        String instruccionSuffix = (request.getInstruccion() != null && !request.getInstruccion().isBlank())
                ? " Instrucción: " + request.getInstruccion().trim()
                : "";

        List<PaqueteDTO> paquetes = new ArrayList<>();
        List<String> guiasEnVarias = new ArrayList<>();

        for (String numeroGuia : numeros) {
            Paquete existente = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia).orElse(null);
            String etiquetaRef;
            String observacionesTipo;

            if (existente != null && existente.getRef() != null && !existente.getRef().isEmpty()) {
                if (ListasEtiquetadasConstants.REF_VARIAS_LISTAS.equals(existente.getRef())) {
                    observacionesTipo = existente.getObservaciones();
                    if (observacionesTipo != null && !observacionesTipo.contains(etiqueta)) {
                        String tipos = observacionesTipo.startsWith(PREFIJO_TIPO)
                                ? observacionesTipo.substring(PREFIJO_TIPO.length()).trim()
                                : observacionesTipo;
                        if (!tipos.isEmpty() && !tipos.contains(etiqueta)) {
                            String parteInstruccion = extraerParteInstruccion(existente.getObservaciones());
                            observacionesTipo = PREFIJO_TIPO + tipos + ", " + etiqueta + (parteInstruccion.isEmpty() ? "" : " " + parteInstruccion) + instruccionSuffix;
                            observacionesTipo = observacionesTipo.trim();
                        } else {
                            observacionesTipo = (observacionesTipo + instruccionSuffix).trim();
                        }
                    } else {
                        observacionesTipo = (observacionesTipo + instruccionSuffix).trim();
                    }
                    etiquetaRef = ListasEtiquetadasConstants.REF_VARIAS_LISTAS;
                    guiasEnVarias.add(numeroGuia);
                } else if (!etiqueta.equals(existente.getRef())) {
                    String tiposPrev = existente.getObservaciones() != null && existente.getObservaciones().startsWith(PREFIJO_TIPO)
                            ? existente.getObservaciones().substring(PREFIJO_TIPO.length()).split(PREFIJO_INSTRUCCION)[0].trim()
                            : existente.getRef();
                    String parteInstruccion = extraerParteInstruccion(existente.getObservaciones());
                    observacionesTipo = PREFIJO_TIPO + tiposPrev + ", " + etiqueta + (parteInstruccion.isEmpty() ? "" : " " + parteInstruccion) + instruccionSuffix;
                    observacionesTipo = observacionesTipo.trim();
                    etiquetaRef = ListasEtiquetadasConstants.REF_VARIAS_LISTAS;
                    guiasEnVarias.add(numeroGuia);
                } else {
                    String parteInstruccion = extraerParteInstruccion(existente.getObservaciones());
                    if (!parteInstruccion.isEmpty() && !instruccionSuffix.isBlank()) {
                        observacionesTipo = existente.getObservaciones().trim() + instruccionSuffix;
                    } else if (!parteInstruccion.isEmpty()) {
                        observacionesTipo = existente.getObservaciones().trim();
                    } else {
                        observacionesTipo = PREFIJO_TIPO + etiqueta + instruccionSuffix;
                    }
                    etiquetaRef = etiqueta;
                }
            } else {
                observacionesTipo = PREFIJO_TIPO + etiqueta + instruccionSuffix;
                etiquetaRef = etiqueta;
            }

            PaqueteDTO dto = paqueteService.createOrUpdateFromListaEtiquetada(numeroGuia, etiquetaRef, observacionesTipo);
            paquetes.add(dto);
        }

        return new ListasEtiquetadasBatchResultDTO(paquetes.size(), paquetes, guiasEnVarias);
    }

    /**
     * Agrega una lista de paquetes (por etiqueta y números de guía) a un lote especial.
     * Crea/actualiza paquetes con datos genéricos y los asocia al lote con estado RECIBIDO.
     */
    public ListasEtiquetadasBatchResultDTO addListasEspecialesALote(Long idLoteRecepcion, ListasEtiquetadasBatchRequest request) {
        LoteRecepcion lote = loteRecepcionRepository.findById(idLoteRecepcion)
                .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", idLoteRecepcion));
        if (lote.getTipoLote() != TipoLote.ESPECIAL) {
            throw new BadRequestException("El lote no es un lote especial. Solo se pueden agregar listas a lotes de tipo ESPECIAL.");
        }
        ListasEtiquetadasBatchResultDTO result = createBatch(request);
        LocalDateTime now = LocalDateTime.now();
        for (PaqueteDTO pDto : result.getPaquetes()) {
            Paquete p = paqueteRepository.findById(pDto.getIdPaquete())
                    .orElseThrow(() -> new ResourceNotFoundException("Paquete", pDto.getIdPaquete()));
            p.setLoteRecepcion(lote);
            p.setEstado(EstadoPaquete.RECIBIDO);
            if (p.getFechaRecepcion() == null) {
                p.setFechaRecepcion(now);
            }
            paqueteRepository.save(p);
        }
        return result;
    }

    public GuiaListaEtiquetadaConsultaDTO consultarGuia(String numeroGuia) {
        String n = numeroGuia != null ? numeroGuia.trim().toUpperCase() : null;
        if (n == null || n.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        Paquete p = paqueteRepository.findByNumeroGuiaIgnoreCase(n).orElse(null);
        if (p == null || p.getRef() == null || p.getRef().isEmpty()) {
            return null;
        }
        List<String> etiquetas = new ArrayList<>();
        boolean varias = ListasEtiquetadasConstants.REF_VARIAS_LISTAS.equals(p.getRef());
        if (varias && p.getObservaciones() != null && p.getObservaciones().startsWith(PREFIJO_TIPO)) {
            String parte = p.getObservaciones().substring(PREFIJO_TIPO.length()).split(" Instrucción:")[0].trim();
            Arrays.stream(parte.split(",")).map(String::trim).filter(s -> !s.isEmpty()).forEach(etiquetas::add);
        }
        if (etiquetas.isEmpty()) {
            etiquetas.add(p.getRef());
        }
        String instruccion = null;
        String obs = p.getObservaciones();
        if (obs != null && obs.contains(" Instrucción:")) {
            int idx = obs.indexOf(" Instrucción:");
            instruccion = obs.substring(idx + " Instrucción:".length()).trim();
        }
        return new GuiaListaEtiquetadaConsultaDTO(
                p.getNumeroGuia(),
                etiquetas,
                varias,
                p.getFechaRecepcion(),
                instruccion
        );
    }

    public Map<String, GuiaListaEtiquetadaConsultaDTO> consultarGuias(List<String> numerosGuia) {
        Map<String, GuiaListaEtiquetadaConsultaDTO> resultado = new HashMap<>();
        if (numerosGuia == null) return resultado;
        List<String> limpios = numerosGuia.stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toUpperCase())
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        for (String num : limpios) {
            GuiaListaEtiquetadaConsultaDTO dto = consultarGuia(num);
            resultado.put(num, dto);
        }
        return resultado;
    }

    public List<GuiaListaEtiquetadaConsultaDTO> getGuiasEnVariasListas() {
        List<Paquete> list = paqueteRepository.findByRef(ListasEtiquetadasConstants.REF_VARIAS_LISTAS);
        return list.stream()
                .map(p -> {
                    List<String> etiquetas = new ArrayList<>();
                    String obs = p.getObservaciones();
                    if (obs != null && obs.startsWith(PREFIJO_TIPO)) {
                        String parte = obs.substring(PREFIJO_TIPO.length()).split(" Instrucción:")[0].trim();
                        Arrays.stream(parte.split(",")).map(String::trim).filter(s -> !s.isEmpty()).forEach(etiquetas::add);
                    }
                    if (etiquetas.isEmpty()) etiquetas.add(p.getRef());
                    String instruccion = null;
                    if (obs != null && obs.contains(" Instrucción:")) {
                        int idx = obs.indexOf(" Instrucción:");
                        instruccion = obs.substring(idx + " Instrucción:".length()).trim();
                    }
                    return new GuiaListaEtiquetadaConsultaDTO(
                            p.getNumeroGuia(),
                            etiquetas,
                            true,
                            p.getFechaRecepcion(),
                            instruccion
                    );
                })
                .sorted(Comparator.comparing(GuiaListaEtiquetadaConsultaDTO::getNumeroGuia))
                .collect(Collectors.toList());
    }

    public PaqueteDTO elegirEtiqueta(String numeroGuia, String etiqueta) {
        return paqueteService.updateRefYObservacionesFromListaEtiquetada(numeroGuia, etiqueta);
    }

    public PaqueteDTO marcarReceptado(String numeroGuia, Long idLoteRecepcion) {
        String n = numeroGuia != null ? numeroGuia.trim().toUpperCase() : null;
        if (n == null || n.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(n).orElse(null);
        if (paquete == null) {
            if (idLoteRecepcion != null && loteRecepcionRepository.existsById(idLoteRecepcion)) {
                paquete = paqueteService.createPaqueteSinEtiqueta(n);
                LoteRecepcion lote = loteRecepcionRepository.findById(idLoteRecepcion).orElse(null);
                paquete.setLoteRecepcion(lote);
                paquete.setEstado(EstadoPaquete.RECIBIDO);
                paquete.setFechaRecepcion(LocalDateTime.now());
                paquete = paqueteRepository.save(paquete);
                return paqueteService.toDTO(paquete);
            }
            throw new ResourceNotFoundException("No se encontró paquete con número de guía: " + numeroGuia);
        }
        LocalDateTime ahora = LocalDateTime.now();
        paquete.setEstado(EstadoPaquete.RECIBIDO);
        if (paquete.getFechaRecepcion() == null) {
            paquete.setFechaRecepcion(ahora);
        }
        if (idLoteRecepcion != null && loteRecepcionRepository.existsById(idLoteRecepcion)) {
            paquete.setLoteRecepcion(loteRecepcionRepository.findById(idLoteRecepcion).orElse(null));
        }
        return paqueteService.toDTO(paqueteRepository.save(paquete));
    }

    public List<PaqueteDTO> getHistorialReceptados() {
        List<Paquete> todos = paqueteRepository.findAllListasEtiquetadas();
        return todos.stream()
                .filter(p -> p.getEstado() == EstadoPaquete.RECIBIDO && p.getFechaRecepcion() != null)
                .sorted(Comparator.comparing(Paquete::getFechaRecepcion, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(50)
                .map(paqueteService::toDTO)
                .collect(Collectors.toList());
    }

    public List<PaqueteDTO> findByEtiqueta(String etiqueta) {
        if (etiqueta == null || etiqueta.trim().isEmpty()) {
            return List.of();
        }
        String et = etiqueta.trim().toUpperCase();
        return paqueteRepository.findByRef(et).stream()
                .map(paqueteService::toDTO)
                .collect(Collectors.toList());
    }

    public List<String> getAllEtiquetas() {
        List<Paquete> list = paqueteRepository.findAllListasEtiquetadas();
        Set<String> set = new TreeSet<>();
        for (Paquete p : list) {
            if (p.getRef() != null && !p.getRef().isEmpty() && !ListasEtiquetadasConstants.REF_VARIAS_LISTAS.equals(p.getRef())) {
                set.add(p.getRef());
            }
        }
        return new ArrayList<>(set);
    }

    public byte[] exportExcel(String etiquetaFiltro) {
        List<Paquete> paquetes;
        if (etiquetaFiltro != null && !etiquetaFiltro.trim().isEmpty()) {
            paquetes = paqueteRepository.findByRef(etiquetaFiltro.trim().toUpperCase());
        } else {
            paquetes = paqueteRepository.findAllListasEtiquetadas();
        }
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Listas etiquetadas");
            int rowNum = 0;
            Row header = sheet.createRow(rowNum++);
            String[] headers = { "Número de guía", "Etiqueta (ref)", "Fecha recepción", "Duplicado (varias listas)", "Instrucción especial" };
            for (int i = 0; i < headers.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(headers[i]);
            }
            for (Paquete p : paquetes) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getNumeroGuia() != null ? p.getNumeroGuia() : "");
                row.createCell(1).setCellValue(p.getRef() != null ? p.getRef() : "");
                row.createCell(2).setCellValue(p.getFechaRecepcion() != null ? p.getFechaRecepcion().toString() : "");
                boolean varias = ListasEtiquetadasConstants.REF_VARIAS_LISTAS.equals(p.getRef());
                row.createCell(3).setCellValue(varias ? "Sí" : "No");
                boolean instruccion = p.getObservaciones() != null && p.getObservaciones().contains("Instrucción:");
                row.createCell(4).setCellValue(instruccion ? "Sí" : "No");
            }
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Error al generar Excel: " + e.getMessage());
        }
    }
}
