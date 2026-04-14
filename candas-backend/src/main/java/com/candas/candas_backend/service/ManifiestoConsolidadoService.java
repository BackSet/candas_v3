package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.ManifiestoConsolidadoSpecs;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ManifiestoConsolidadoService {

    private final ManifiestoConsolidadoRepository manifiestoConsolidadoRepository;
    private final DespachoRepository despachoRepository;
    private final AgenciaRepository agenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final DistribuidorRepository distribuidorRepository;
    private final DestinatarioDirectoRepository destinatarioDirectoRepository;
    private final AgenciaScopeResolver agenciaScopeResolver;

    public ManifiestoConsolidadoService(
            ManifiestoConsolidadoRepository manifiestoConsolidadoRepository,
            DespachoRepository despachoRepository,
            AgenciaRepository agenciaRepository,
            UsuarioRepository usuarioRepository,
            DistribuidorRepository distribuidorRepository,
            DestinatarioDirectoRepository destinatarioDirectoRepository,
            AgenciaScopeResolver agenciaScopeResolver) {
        this.manifiestoConsolidadoRepository = manifiestoConsolidadoRepository;
        this.despachoRepository = despachoRepository;
        this.agenciaRepository = agenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.distribuidorRepository = distribuidorRepository;
        this.destinatarioDirectoRepository = destinatarioDirectoRepository;
        this.agenciaScopeResolver = agenciaScopeResolver;
    }

    public ManifiestoConsolidadoResumenDTO crearManifiestoConsolidado(ManifiestoConsolidadoDTO dto) {
        Long idAgenciaPropietariaScope = agenciaScopeResolver.requireAgenciaOrigenActivaParaCreacion().orElse(null);

        Usuario usuarioActual = obtenerUsuarioActual();
        validarPeriodo(dto);
        validarFiltrosManifiesto(dto);
        Agencia agencia = resolverEntidadFiltro(dto);

        LocalDateTime[] rango = obtenerRangoFechas(dto.getFechaInicio(), dto.getFechaFin(), dto.getMes(), dto.getAnio());
        List<Despacho> despachos = obtenerDespachosEnRango(
                idAgenciaPropietariaScope,
                dto.getIdAgencia(), dto.getIdDistribuidor(), dto.getIdDestinatarioDirecto(),
                rango[0], rango[1]);
        boolean agruparPorTipo = dto.getIdAgencia() == null && dto.getIdDistribuidor() == null && dto.getIdDestinatarioDirecto() == null;
        ordenarDespachosParaManifiesto(despachos, agruparPorTipo);
        inicializarLazyDespachos(despachos);

        // Calcular totales
        TotalesManifiestoDTO totales = calcularTotales(despachos);

        // Crear y guardar entidad ManifiestoConsolidado
        ManifiestoConsolidado manifiestoConsolidado = new ManifiestoConsolidado();
        manifiestoConsolidado.setAgencia(agencia);
        resolverAgenciaPropietariaActual().ifPresent(manifiestoConsolidado::setAgenciaPropietaria);
        manifiestoConsolidado.setFechaInicio(dto.getFechaInicio());
        manifiestoConsolidado.setFechaFin(dto.getFechaFin());
        manifiestoConsolidado.setMes(dto.getMes());
        manifiestoConsolidado.setAnio(dto.getAnio());
        // Generar número de manifiesto automáticamente
        String numeroManifiesto = generarNumeroManifiesto();
        manifiestoConsolidado.setNumeroManifiesto(numeroManifiesto);

        manifiestoConsolidado.setFechaGeneracion(LocalDateTime.now());
        manifiestoConsolidado.setUsuarioGenerador(usuarioActual);
        manifiestoConsolidado.setTotalDespachos(totales.getTotalDespachos());
        manifiestoConsolidado.setTotalSacas(totales.getTotalSacas());
        manifiestoConsolidado.setTotalPaquetes(totales.getTotalPaquetes());
        manifiestoConsolidado.setPesoTotal(totales.getPesoTotal());

        ManifiestoConsolidado guardado = guardarConReintentoNumeroManifiesto(manifiestoConsolidado);
        return toResumenDTO(guardado);
    }

    public Page<ManifiestoConsolidadoResumenDTO> findAll(Pageable pageable) {
        Long idAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = ManifiestoConsolidadoSpecs.withFilters(null, null, idAgencia, null, null);
        Pageable p = pageable.getSort().isSorted() ? pageable : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("fechaGeneracion").descending());
        return manifiestoConsolidadoRepository.findAll(spec, p).map(this::toResumenDTO);
    }

    public Page<ManifiestoConsolidadoResumenDTO> findAll(Pageable pageable, String search, String numeroManifiesto, Long idAgencia, Integer mes, Integer anio) {
        Long effectiveIdAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(idAgencia);
        var spec = ManifiestoConsolidadoSpecs.withFilters(search, numeroManifiesto, effectiveIdAgencia, mes, anio);
        Pageable p = pageable.getSort().isSorted() ? pageable : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("fechaGeneracion").descending());
        return manifiestoConsolidadoRepository.findAll(spec, p).map(this::toResumenDTO);
    }

    public ManifiestoConsolidadoDetalleDTO findById(Long id) {
        ManifiestoConsolidado manifiesto = manifiestoConsolidadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManifiestoConsolidado", id));
        assertManifiestoAccesible(manifiesto);
        return toDetalleDTO(manifiesto);
    }

    public List<ManifiestoConsolidadoResumenDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = manifiestoConsolidadoRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        return manifiestoConsolidadoRepository.findAllByIdWithAgencia(ids).stream()
                .filter(this::manifiestoVisibleParaAlcance)
                .map(this::toResumenDTO)
                .collect(Collectors.toList());
    }

    public Page<ManifiestoConsolidadoResumenDTO> findByAgencia(Long idAgencia, Pageable pageable) {
        Long idAgenciaPropietaria = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = ManifiestoConsolidadoSpecs.withFilters(null, null, idAgenciaPropietaria, null, null)
                .and((root, query, cb) -> cb.equal(root.join("agencia", jakarta.persistence.criteria.JoinType.LEFT).get("idAgencia"), idAgencia));
        return manifiestoConsolidadoRepository.findAll(spec, pageable)
                .map(this::toResumenDTO);
    }

    public void delete(Long id) {
        ManifiestoConsolidado manifiesto = manifiestoConsolidadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ManifiestoConsolidado", id));
        assertManifiestoAccesible(manifiesto);
        manifiestoConsolidadoRepository.delete(manifiesto);
    }

    private boolean manifiestoVisibleParaAlcance(ManifiestoConsolidado m) {
        return agenciaScopeResolver.idAgenciaRestringida()
                .map(idAg -> m.getAgenciaPropietaria() != null && idAg.equals(m.getAgenciaPropietaria().getIdAgencia()))
                .orElse(true);
    }

    private void assertManifiestoAccesible(ManifiestoConsolidado m) {
        agenciaScopeResolver.idAgenciaRestringida().ifPresent(idAgenciaUsuario -> {
            if (!manifiestoVisibleParaAlcance(m)) {
                String agenciaUsuario = descripcionAgencia(agenciaRepository.findById(idAgenciaUsuario).orElse(null), idAgenciaUsuario);
                String agenciaRecurso = descripcionAgencia(m.getAgenciaPropietaria());
                throw new AgenciaAccessDeniedException("Tu usuario pertenece a la " + agenciaUsuario
                        + ". El manifiesto solicitado pertenece a " + agenciaRecurso
                        + ". No tienes acceso a estos datos mientras no inicies sesión con un usuario de esa agencia.");
            }
        });
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

    private ManifiestoConsolidadoDetalleDTO generarManifiestoConsolidado(Long idAgencia, Long idDistribuidor,
            Long idDestinatarioDirecto, LocalDate fechaInicio, LocalDate fechaFin, Integer mes, Integer anio) {
        Agencia agencia = null;
        Distribuidor distribuidor = null;
        DestinatarioDirecto destinatarioDirecto = null;
        if (idAgencia != null) {
            agencia = agenciaRepository.findById(idAgencia)
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", idAgencia));
        } else if (idDistribuidor != null) {
            distribuidor = distribuidorRepository.findById(idDistribuidor)
                    .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", idDistribuidor));
        } else if (idDestinatarioDirecto != null) {
            destinatarioDirecto = destinatarioDirectoRepository.findById(idDestinatarioDirecto)
                    .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", idDestinatarioDirecto));
        }

        LocalDateTime[] rango = obtenerRangoFechas(fechaInicio, fechaFin, mes, anio);
        Long idAgenciaPropietariaScope = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        List<Despacho> despachos = obtenerDespachosEnRango(
                idAgenciaPropietariaScope,
                idAgencia,
                idDistribuidor,
                idDestinatarioDirecto,
                rango[0],
                rango[1]
        );
        boolean agruparPorTipo = idAgencia == null && idDistribuidor == null && idDestinatarioDirecto == null;
        ordenarDespachosParaManifiesto(despachos, agruparPorTipo);
        inicializarLazyDespachos(despachos);

        List<DespachoDetalleDTO> despachosDTO = despachos.stream()
                .map(this::toDespachoDetalleDTO)
                .collect(Collectors.toList());

        TotalesManifiestoDTO totales = calcularTotales(despachos);

        ManifiestoConsolidadoDetalleDTO manifiesto = new ManifiestoConsolidadoDetalleDTO();
        if (agencia != null) {
            manifiesto.setIdAgencia(agencia.getIdAgencia());
            manifiesto.setNombreAgencia(agencia.getNombre());
            manifiesto.setCodigoAgencia(agencia.getCodigo());
            manifiesto.setDireccionAgencia(agencia.getDireccion());
            manifiesto.setCantonAgencia(agencia.getCanton());
        } else if (distribuidor != null) {
            manifiesto.setIdAgencia(null);
            manifiesto.setNombreAgencia(distribuidor.getNombre());
            manifiesto.setCodigoAgencia(distribuidor.getCodigo());
            // Distribuidor no tiene direccion ni provincia
            manifiesto.setDireccionAgencia(null);
            manifiesto.setCantonAgencia(null);
        } else if (destinatarioDirecto != null) {
            manifiesto.setIdAgencia(null);
            manifiesto.setNombreAgencia(destinatarioDirecto.getNombreDestinatario() != null
                    ? destinatarioDirecto.getNombreDestinatario()
                    : "DESTINATARIO DIRECTO");
            manifiesto.setCodigoAgencia(null);
            manifiesto.setDireccionAgencia(destinatarioDirecto.getDireccionDestinatario());
            manifiesto.setCantonAgencia(null);
        } else {
            manifiesto.setNombreAgencia("TODAS LAS AGENCIAS Y DESTINATARIOS DIRECTOS");
        }
        manifiesto.setFechaInicio(fechaInicio);
        manifiesto.setFechaFin(fechaFin);
        manifiesto.setMes(mes);
        manifiesto.setAnio(anio);
        manifiesto.setDespachos(despachosDTO);
        manifiesto.setTotales(totales);

        return manifiesto;
    }

    private static LocalDateTime[] obtenerRangoFechas(LocalDate fechaInicio, LocalDate fechaFin, Integer mes, Integer anio) {
        LocalDateTime inicio;
        LocalDateTime fin;
        if (fechaInicio != null && fechaFin != null) {
            inicio = fechaInicio.atStartOfDay();
            fin = fechaFin.atTime(23, 59, 59);
        } else if (mes != null && anio != null) {
            inicio = LocalDate.of(anio, mes, 1).atStartOfDay();
            fin = LocalDate.of(anio, mes, LocalDate.of(anio, mes, 1).lengthOfMonth()).atTime(23, 59, 59);
        } else if (anio != null && mes == null) {
            inicio = LocalDate.of(anio, 1, 1).atStartOfDay();
            fin = LocalDate.of(anio, 12, 31).atTime(23, 59, 59);
        } else {
            throw new IllegalArgumentException("Debe proporcionar fechaInicio/fechaFin, mes/anio, o anio");
        }
        return new LocalDateTime[] { inicio, fin };
    }

    private List<Despacho> obtenerDespachosEnRango(Long idAgenciaPropietariaScope, Long idAgenciaDestino, Long idDistribuidor, Long idDestinatarioDirecto,
            LocalDateTime inicio, LocalDateTime fin) {
        if (idAgenciaPropietariaScope != null) {
            if (idAgenciaDestino != null) {
                return despachoRepository.findByAgenciaPropietaria_IdAgenciaAndAgencia_IdAgenciaAndFechaDespachoBetween(
                        idAgenciaPropietariaScope, idAgenciaDestino, inicio, fin);
            }
            if (idDistribuidor != null) {
                return despachoRepository.findByAgenciaPropietaria_IdAgenciaAndDistribuidor_IdDistribuidorAndFechaDespachoBetween(
                        idAgenciaPropietariaScope, idDistribuidor, inicio, fin);
            }
            if (idDestinatarioDirecto != null) {
                return despachoRepository.findByAgenciaPropietaria_IdAgenciaAndDestinatarioDirecto_IdDestinatarioDirectoAndFechaDespachoBetween(
                        idAgenciaPropietariaScope, idDestinatarioDirecto, inicio, fin);
            }
            return despachoRepository.findByAgenciaPropietaria_IdAgenciaAndFechaDespachoBetween(idAgenciaPropietariaScope, inicio, fin);
        }

        if (idAgenciaDestino != null) {
            return despachoRepository.findByAgencia_IdAgenciaAndFechaDespachoBetween(idAgenciaDestino, inicio, fin);
        }
        if (idDistribuidor != null) {
            return despachoRepository.findByDistribuidor_IdDistribuidorAndFechaDespachoBetween(idDistribuidor, inicio, fin);
        }
        if (idDestinatarioDirecto != null) {
            return despachoRepository.findByDestinatarioDirecto_IdDestinatarioDirectoAndFechaDespachoBetween(idDestinatarioDirecto, inicio, fin);
        }
        return despachoRepository.findByFechaDespachoBetween(inicio, fin);
    }

    private static void ordenarDespachosParaManifiesto(List<Despacho> despachos, boolean agruparPorTipo) {
        if (agruparPorTipo) {
            despachos.sort(Comparator
                    .comparing((Despacho d) -> d.getDestinatarioDirecto() != null ? 1 : 0)
                    .thenComparing((Despacho d) -> {
                        if (d.getDestinatarioDirecto() != null) {
                            return d.getDestinatarioDirecto().getNombreDestinatario() != null
                                    ? d.getDestinatarioDirecto().getNombreDestinatario() : "";
                        }
                        if (d.getAgencia() != null) {
                            return d.getAgencia().getNombre() != null ? d.getAgencia().getNombre() : "";
                        }
                        return "";
                    })
                    .thenComparing(Despacho::getFechaDespacho));
        } else {
            despachos.sort(Comparator.comparing(Despacho::getFechaDespacho));
        }
    }

    private static void inicializarLazyDespachos(List<Despacho> despachos) {
        for (Despacho despacho : despachos) {
            if (despacho.getDestinatarioDirecto() != null) {
                despacho.getDestinatarioDirecto().getNombreDestinatario();
            }
            if (despacho.getSacas() != null) {
                for (Saca saca : despacho.getSacas()) {
                    if (saca.getPaqueteSacas() != null) {
                        saca.getPaqueteSacas().size();
                    }
                }
            }
        }
    }

    private TotalesManifiestoDTO calcularTotales(List<Despacho> despachos) {
        TotalesManifiestoDTO totales = new TotalesManifiestoDTO();
        totales.setTotalDespachos(despachos.size());

        int totalSacas = 0;
        int totalPaquetes = 0;
        BigDecimal pesoTotal = BigDecimal.ZERO;

        for (Despacho despacho : despachos) {
            if (despacho.getSacas() != null) {
                totalSacas += despacho.getSacas().size();
                for (Saca saca : despacho.getSacas()) {
                    if (saca.getPaqueteSacas() != null) {
                        totalPaquetes += saca.getPaqueteSacas().size();
                        for (PaqueteSaca ps : saca.getPaqueteSacas()) {
                            Paquete paquete = ps.getPaquete();
                            if (paquete != null && paquete.getPesoKilos() != null) {
                                pesoTotal = pesoTotal.add(paquete.getPesoKilos());
                            }
                        }
                    }
                }
            }
        }

        totales.setTotalSacas(totalSacas);
        totales.setTotalPaquetes(totalPaquetes);
        totales.setPesoTotal(pesoTotal);
        return totales;
    }

    private DespachoDetalleDTO toDespachoDetalleDTO(Despacho despacho) {
        DespachoDetalleDTO dto = new DespachoDetalleDTO();
        dto.setIdDespacho(despacho.getIdDespacho());
        dto.setNumeroManifiesto(despacho.getNumeroManifiesto());
        dto.setFechaDespacho(despacho.getFechaDespacho());
        dto.setNumeroGuiaAgenciaDistribucion(despacho.getNumeroGuiaAgenciaDistribucion());
        dto.setCodigoPresinto(despacho.getCodigoPresinto());

        // Mapear agencia normal (para agrupación)
        if (despacho.getAgencia() != null) {
            dto.setNombreAgencia(despacho.getAgencia().getNombre());
            dto.setCodigoAgencia(despacho.getAgencia().getCodigo());
            dto.setCantonAgencia(despacho.getAgencia().getCanton());
        }

        // Mapear distribuidor (solo para mostrar en el detalle)
        if (despacho.getDistribuidor() != null) {
            dto.setNombreDistribuidor(despacho.getDistribuidor().getNombre());
        }

        // Mapear destinatario directo (si el despacho es directo)
        if (despacho.getDestinatarioDirecto() != null) {
            DestinatarioDirecto destinatario = despacho.getDestinatarioDirecto();
            dto.setEsDestinatarioDirecto(true);
            dto.setNombreDestinatarioDirecto(destinatario.getNombreDestinatario());
            dto.setTelefonoDestinatarioDirecto(destinatario.getTelefonoDestinatario());
            dto.setDireccionDestinatarioDirecto(destinatario.getDireccionDestinatario());
            dto.setCantonDestinatarioDirecto(destinatario.getCanton());
        } else {
            dto.setEsDestinatarioDirecto(false);
        }

        List<Saca> sacas = despacho.getSacas() != null ? despacho.getSacas() : new ArrayList<>();
        sacas.sort(Comparator.comparing(Saca::getNumeroOrden));

        List<SacaDetalleDTO> sacasDTO = sacas.stream()
                .map(this::toSacaDetalleDTO)
                .collect(Collectors.toList());

        dto.setSacas(sacasDTO);
        dto.setTotalSacas(sacas.size());
        dto.setTotalPaquetes(sacas.stream()
                .mapToInt(s -> s.getPaqueteSacas() != null ? s.getPaqueteSacas().size() : 0)
                .sum());

        return dto;
    }

    private SacaDetalleDTO toSacaDetalleDTO(Saca saca) {
        SacaDetalleDTO dto = new SacaDetalleDTO();
        dto.setIdSaca(saca.getIdSaca());
        dto.setNumeroOrden(saca.getNumeroOrden());
        dto.setTamano(saca.getTamano());
        dto.setCodigoQr(saca.getCodigoQr());

        List<PaqueteSaca> paqueteSacas = saca.getPaqueteSacas() != null ? new ArrayList<>(saca.getPaqueteSacas()) : new ArrayList<>();
        paqueteSacas.sort(Comparator.comparing(PaqueteSaca::getOrdenEnSaca, Comparator.nullsLast(Comparator.naturalOrder())));
        List<Paquete> paquetes = paqueteSacas.stream().map(PaqueteSaca::getPaquete).collect(Collectors.toList());
        dto.setCantidadPaquetes(paquetes.size());

        List<PaqueteDetalleDTO> paquetesDTO = paquetes.stream()
                .map(this::toPaqueteDetalleDTO)
                .collect(Collectors.toList());

        dto.setPaquetes(paquetesDTO);
        return dto;
    }

    private PaqueteDetalleDTO toPaqueteDetalleDTO(Paquete paquete) {
        PaqueteDetalleDTO dto = new PaqueteDetalleDTO();
        dto.setIdPaquete(paquete.getIdPaquete());
        dto.setNumeroGuia(paquete.getNumeroGuia());
        dto.setRef(paquete.getRef());

        if (paquete.getClienteDestinatario() != null) {
            dto.setNombreClienteDestinatario(paquete.getClienteDestinatario().getNombreCompleto());
        }

        if (paquete.getClienteDestinatario() != null) {
            dto.setDireccionDestinatarioCompleta(construirDireccionCompleta(
                    paquete.getClienteDestinatario().getDireccion(),
                    paquete.getClienteDestinatario().getCanton(),
                    paquete.getClienteDestinatario().getProvincia(),
                    paquete.getClienteDestinatario().getPais()));
            dto.setProvinciaDestinatario(paquete.getClienteDestinatario().getProvincia());
            dto.setPaisDestinatario(paquete.getClienteDestinatario().getPais());
            dto.setCantonDestinatario(paquete.getClienteDestinatario().getCanton());
            dto.setTelefonoDestinatario(paquete.getClienteDestinatario().getTelefono());
        }

        dto.setObservaciones(paquete.getObservaciones());
        return dto;
    }

    private String construirDireccionCompleta(String direccion, String canton, String provincia, String pais) {
        List<String> partes = new ArrayList<>();
        if (direccion != null && !direccion.trim().isEmpty()) {
            partes.add(direccion.trim());
        }
        if (canton != null && !canton.trim().isEmpty()) {
            partes.add(canton.trim());
        }
        if (provincia != null && !provincia.trim().isEmpty()) {
            partes.add(provincia.trim());
        }
        if (pais != null && !pais.trim().isEmpty()) {
            partes.add(pais.trim());
        }
        return partes.isEmpty() ? null : String.join(", ", partes);
    }

    private ManifiestoConsolidadoResumenDTO toResumenDTO(ManifiestoConsolidado manifiesto) {
        ManifiestoConsolidadoResumenDTO dto = new ManifiestoConsolidadoResumenDTO();
        dto.setIdManifiestoConsolidado(manifiesto.getIdManifiestoConsolidado());
        dto.setNumeroManifiesto(manifiesto.getNumeroManifiesto());
        if (manifiesto.getAgencia() != null) {
            dto.setIdAgencia(manifiesto.getAgencia().getIdAgencia());
            dto.setNombreAgencia(manifiesto.getAgencia().getNombre());
            dto.setCodigoAgencia(manifiesto.getAgencia().getCodigo());
        } else {
            dto.setNombreAgencia("TODAS LAS AGENCIAS");
        }
        if (manifiesto.getAgenciaPropietaria() != null) {
            dto.setIdAgenciaPropietaria(manifiesto.getAgenciaPropietaria().getIdAgencia());
            dto.setNombreAgenciaPropietaria(manifiesto.getAgenciaPropietaria().getNombre());
        }
        dto.setFechaGeneracion(manifiesto.getFechaGeneracion());
        dto.setUsuarioGenerador(nombreVisibleUsuario(manifiesto.getUsuarioGenerador()));
        dto.setTotalDespachos(manifiesto.getTotalDespachos());
        dto.setTotalSacas(manifiesto.getTotalSacas());
        dto.setTotalPaquetes(manifiesto.getTotalPaquetes());

        // Formatear período
        if (manifiesto.getFechaInicio() != null && manifiesto.getFechaFin() != null) {
            dto.setPeriodo(String.format("Del %s al %s",
                    manifiesto.getFechaInicio().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    manifiesto.getFechaFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        } else if (manifiesto.getMes() != null && manifiesto.getAnio() != null) {
            String[] meses = { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
            dto.setPeriodo(String.format("Mes: %s %d", meses[manifiesto.getMes()], manifiesto.getAnio()));
        } else {
            dto.setPeriodo("Período no especificado");
        }

        return dto;
    }

    private ManifiestoConsolidadoDetalleDTO toDetalleDTO(ManifiestoConsolidado manifiesto) {
        // Regenerar datos del manifiesto desde los metadatos guardados
        Long idAgencia = manifiesto.getAgencia() != null ? manifiesto.getAgencia().getIdAgencia() : null;
        // Nota: La entidad ManifiestoConsolidado solo guarda agencia, no distribuidor
        // ni destinatario directo
        // Por lo tanto, solo podemos regenerar por agencia normal
        ManifiestoConsolidadoDetalleDTO detalle = generarManifiestoConsolidado(
                idAgencia,
                null, // idDistribuidor - no se guarda en la entidad
                null, // idDestinatarioDirecto - no se guarda en la entidad
                manifiesto.getFechaInicio(),
                manifiesto.getFechaFin(),
                manifiesto.getMes(),
                manifiesto.getAnio());
        // Agregar metadatos del manifiesto guardado
        detalle.setIdManifiestoConsolidado(manifiesto.getIdManifiestoConsolidado());
        detalle.setNumeroManifiesto(manifiesto.getNumeroManifiesto());
        detalle.setFechaGeneracion(manifiesto.getFechaGeneracion());
        detalle.setUsuarioGenerador(nombreVisibleUsuario(manifiesto.getUsuarioGenerador()));
        if (manifiesto.getAgenciaPropietaria() != null) {
            detalle.setIdAgenciaPropietaria(manifiesto.getAgenciaPropietaria().getIdAgencia());
            detalle.setNombreAgenciaPropietaria(manifiesto.getAgenciaPropietaria().getNombre());
        }
        return detalle;
    }

    private java.util.Optional<Agencia> resolverAgenciaPropietariaActual() {
        return agenciaScopeResolver.idAgenciaRestringida()
                .flatMap(agenciaRepository::findById);
    }

    private void validarPeriodo(ManifiestoConsolidadoDTO dto) {
        if (dto.getFechaInicio() != null && dto.getFechaFin() != null) {
            if (dto.getFechaInicio().isAfter(dto.getFechaFin())) {
                throw new IllegalArgumentException("La fecha de inicio debe ser anterior o igual a la fecha de fin");
            }
        } else if (dto.getMes() != null && dto.getAnio() != null) {
            if (dto.getMes() < 1 || dto.getMes() > 12) {
                throw new IllegalArgumentException("El mes debe estar entre 1 y 12");
            }
            if (dto.getAnio() < 2000 || dto.getAnio() > 2100) {
                throw new IllegalArgumentException("El año debe ser válido");
            }
        } else {
            throw new IllegalArgumentException("Debe proporcionar fechaInicio/fechaFin o mes/anio");
        }
    }

    private void validarFiltrosManifiesto(ManifiestoConsolidadoDTO dto) {
        int filtrosProporcionados = 0;
        if (dto.getIdAgencia() != null) filtrosProporcionados++;
        if (dto.getIdDistribuidor() != null) filtrosProporcionados++;
        if (dto.getIdDestinatarioDirecto() != null) filtrosProporcionados++;
        if (filtrosProporcionados > 1) {
            throw new IllegalArgumentException(
                    "No se puede proporcionar idAgencia, idDistribuidor e idDestinatarioDirecto al mismo tiempo. Solo se permite uno.");
        }
    }

    private Agencia resolverEntidadFiltro(ManifiestoConsolidadoDTO dto) {
        if (dto.getIdAgencia() != null) {
            return agenciaRepository.findById(dto.getIdAgencia())
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
        }
        if (dto.getIdDistribuidor() != null) {
            distribuidorRepository.findById(dto.getIdDistribuidor())
                    .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", dto.getIdDistribuidor()));
        }
        if (dto.getIdDestinatarioDirecto() != null) {
            destinatarioDirectoRepository.findById(dto.getIdDestinatarioDirecto())
                    .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", dto.getIdDestinatarioDirecto()));
        }
        return null;
    }

    private static final int MAX_REINTENTOS_NUMERO_MANIFIESTO = 5;
    private static final String PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO = "MCF-";
    private static final int PADDING_HEX_CODIGO = 8;

    private ManifiestoConsolidado guardarConReintentoNumeroManifiesto(ManifiestoConsolidado manifiestoConsolidado) {
        String maxNumeroStr = manifiestoConsolidadoRepository.findMaxNumeroManifiesto();
        long siguienteIdBase = 0;
        if (maxNumeroStr != null && maxNumeroStr.length() > PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO.length()) {
            try {
                siguienteIdBase = Long.parseLong(
                        maxNumeroStr.substring(PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO.length()), 16);
            } catch (NumberFormatException ignored) {
            }
        }
        for (int intento = 0; intento < MAX_REINTENTOS_NUMERO_MANIFIESTO; intento++) {
            try {
                return manifiestoConsolidadoRepository.save(manifiestoConsolidado);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                if (intento >= MAX_REINTENTOS_NUMERO_MANIFIESTO - 1) throw e;
                siguienteIdBase++;
                String codigoHex = String.format("%0" + PADDING_HEX_CODIGO + "X", siguienteIdBase + 1);
                manifiestoConsolidado.setNumeroManifiesto(PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO + codigoHex);
            }
        }
        throw new IllegalStateException("No se pudo guardar el manifiesto consolidado");
    }

    private String generarNumeroManifiesto() {
        String maxNumeroStr = manifiestoConsolidadoRepository.findMaxNumeroManifiesto();
        long siguienteId = 1;
        if (maxNumeroStr != null && maxNumeroStr.length() > PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO.length()) {
            try {
                long maxNumero = Long.parseLong(maxNumeroStr.substring(PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO.length()), 16);
                siguienteId = maxNumero + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        String codigoHex = String.format("%0" + PADDING_HEX_CODIGO + "X", siguienteId);
        return PREFIJO_NUMERO_MANIFIESTO_CONSOLIDADO + codigoHex;
    }

    private Usuario obtenerUsuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            return usuarioRepository.findByUsername(authentication.getName()).orElse(null);
        }
        return null;
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
