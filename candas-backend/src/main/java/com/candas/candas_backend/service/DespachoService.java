package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.DestinatarioDirectoDTO;
import com.candas.candas_backend.dto.DespachoDTO;
import com.candas.candas_backend.dto.DespachoDirectoDTO;
import com.candas.candas_backend.dto.SacaDTO;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TamanoSaca;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.repository.spec.DespachoSpecs;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import com.candas.candas_backend.util.PresintoUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DespachoService {
    private static final String PREFIJO_NUMERO_MANIFIESTO = "MAN-";
    private static final String PREFIJO_CODIGO_QR_SACA = "SAC-";
    private static final int PADDING_HEX_CODIGO = 8;
    private static final int PADDING_NUMERO_ORDEN_SACA = 2;

    private final DespachoRepository despachoRepository;
    private final SacaRepository sacaRepository;
    private final AgenciaRepository agenciaRepository;
    private final DistribuidorRepository distribuidorRepository;
    private final PaqueteRepository paqueteRepository;
    private final DestinatarioDirectoRepository destinatarioDirectoRepository;
    private final PresintoUtil presintoUtil;
    private final AgenciaScopeResolver agenciaScopeResolver;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    public DespachoService(
            DespachoRepository despachoRepository,
            SacaRepository sacaRepository,
            AgenciaRepository agenciaRepository,
            DistribuidorRepository distribuidorRepository,
            PaqueteRepository paqueteRepository,
            DestinatarioDirectoRepository destinatarioDirectoRepository,
            PresintoUtil presintoUtil,
            AgenciaScopeResolver agenciaScopeResolver,
            UsuarioRepository usuarioRepository,
            JdbcTemplate jdbcTemplate) {
        this.despachoRepository = despachoRepository;
        this.sacaRepository = sacaRepository;
        this.agenciaRepository = agenciaRepository;
        this.distribuidorRepository = distribuidorRepository;
        this.paqueteRepository = paqueteRepository;
        this.destinatarioDirectoRepository = destinatarioDirectoRepository;
        this.presintoUtil = presintoUtil;
        this.agenciaScopeResolver = agenciaScopeResolver;
        this.usuarioRepository = usuarioRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Page<DespachoDTO> findAll(Pageable pageable, String tipoDestino, LocalDate fechaDesde, LocalDate fechaHasta, String search) {
        LocalDateTime inicio = null;
        LocalDateTime fin = null;
        if (fechaDesde != null && fechaHasta != null && !fechaHasta.isBefore(fechaDesde)) {
            inicio = fechaDesde.atStartOfDay();
            fin = fechaHasta.atTime(23, 59, 59, 999_000_000);
        }
        String searchTrimmed = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Long idAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = DespachoSpecs.withFilters(searchTrimmed, inicio, fin, tipoDestino, idAgencia);
        return despachoRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public DespachoDTO findById(Long id) {
        Despacho despacho = despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
        assertDespachoAccesible(despacho);
        return toDTO(despacho);
    }

    public List<DespachoDTO> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<Long> ids = despachoRepository.searchIds(query.trim());
        if (ids.isEmpty()) {
            return List.of();
        }
        Optional<Long> idAgenciaOpt = agenciaScopeResolver.idAgenciaRestringida();
        return despachoRepository.findAllByIdWithRelations(ids).stream()
            .filter(d -> idAgenciaOpt.isEmpty() || despachoVisibleParaAgencia(d, idAgenciaOpt.get()))
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public List<DespachoDTO> findByPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null || fechaFin == null || fechaFin.isBefore(fechaInicio)) {
            return List.of();
        }
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59, 999_000_000);
        Long idAgencia = agenciaScopeResolver.idAgenciaRestringida().orElse(null);
        var spec = DespachoSpecs.withFilters(null, inicio, fin, null, idAgencia);
        return despachoRepository.findAll(spec).stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Despacho visible para alcance de agencia si el usuario registrador pertenece a esa agencia.
     */
    private boolean despachoVisibleParaAgencia(Despacho despacho, Long idAgencia) {
        return usuarioRepository.findByUsername(despacho.getUsuarioRegistro())
                .filter(u -> u.getAgencia() != null && idAgencia.equals(u.getAgencia().getIdAgencia()))
                .isPresent();
    }

    private void assertDespachoAccesible(Despacho despacho) {
        agenciaScopeResolver.idAgenciaRestringida().ifPresent(idAg -> {
            if (!despachoVisibleParaAgencia(despacho, idAg)) {
                throw new AgenciaAccessDeniedException(construirMensajeAccesoDespacho(idAg, despacho));
            }
        });
    }

    /**
     * Valida acceso al despacho por ID (p. ej. Sacas u otros módulos que referencian {@code idDespacho}).
     */
    public void ensureDespachoAccesible(Long idDespacho) {
        Despacho despacho = despachoRepository.findById(idDespacho)
                .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        assertDespachoAccesible(despacho);
    }

    /**
     * Indica si el despacho es visible para el usuario autenticado según alcance por agencia (sin cargar de nuevo por ID).
     */
    public boolean isDespachoAccesiblePorAlcance(Despacho despacho) {
        return agenciaScopeResolver.idAgenciaRestringida()
                .map(idAg -> despachoVisibleParaAgencia(despacho, idAg))
                .orElse(true);
    }

    private String construirMensajeAccesoDespacho(Long idAgenciaUsuario, Despacho despacho) {
        var agenciaUsuario = descripcionAgencia(agenciaRepository.findById(idAgenciaUsuario).orElse(null), idAgenciaUsuario);
        var agenciaDespacho = usuarioRepository.findByUsername(despacho.getUsuarioRegistro())
                .map(Usuario::getAgencia)
                .map(this::descripcionAgencia)
                .orElse("agencia no identificada");
        return "Tu usuario pertenece a la " + agenciaUsuario
                + ". El despacho solicitado pertenece a " + agenciaDespacho
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

    public DespachoDTO create(DespachoDTO dto) {
        agenciaScopeResolver.idAgenciaRestringida().ifPresent(ignored -> {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                dto.setUsuarioRegistro(auth.getName());
            }
        });

        validarDespacho(dto);

        Despacho despacho = toEntity(dto);
        
        // Asignar agencia si se proporciona
        if (dto.getIdAgencia() != null) {
            Agencia agencia = agenciaRepository.findById(dto.getIdAgencia())
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
            despacho.setAgencia(agencia);
        }

        // Buscar o crear distribuidor
        if (dto.getIdDistribuidor() != null) {
            Distribuidor distribuidor = distribuidorRepository.findById(dto.getIdDistribuidor())
                .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", dto.getIdDistribuidor()));
            despacho.setDistribuidor(distribuidor);
        }

        despacho.setNumeroGuiaAgenciaDistribucion(dto.getNumeroGuiaAgenciaDistribucion());
        
        // Asignar destinatario directo: existente o creado desde paquete (prioridad a existente)
        if (dto.getIdDestinatarioDirecto() != null) {
            DestinatarioDirecto destinatarioDirecto = destinatarioDirectoRepository.findById(dto.getIdDestinatarioDirecto())
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", dto.getIdDestinatarioDirecto()));
            despacho.setDestinatarioDirecto(destinatarioDirecto);
        } else if (dto.getIdPaqueteOrigenDestinatario() != null) {
            despacho.setDestinatarioDirecto(crearDestinatarioDesdePaquete(dto.getIdPaqueteOrigenDestinatario()));
        }

        // Guardar primero para obtener un ID real y generar un manifiesto sin colisiones.
        Despacho despachoGuardado = despachoRepository.save(despacho);
        if (despachoGuardado.getNumeroManifiesto() == null || despachoGuardado.getNumeroManifiesto().isBlank()) {
            despachoGuardado.setNumeroManifiesto(generarNumeroManifiesto(despachoGuardado.getIdDespacho()));
            despachoGuardado = despachoRepository.save(despachoGuardado);
        }
        if (despachoGuardado.getCodigoPresinto() == null || despachoGuardado.getCodigoPresinto().isBlank()) {
            despachoGuardado.setCodigoPresinto(calcularCodigoPresinto(despachoGuardado));
            despachoGuardado = despachoRepository.save(despachoGuardado);
        }

        crearYAsignarSacas(despachoGuardado, dto.getSacas());
        final Long idDespachoCreado = despachoGuardado.getIdDespacho();
        Despacho recargado = despachoRepository.findById(idDespachoCreado)
                .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespachoCreado));
        assertDespachoAccesible(recargado);
        return toDTO(recargado);
    }

    private String calcularCodigoPresinto(Despacho despacho) {
        return presintoUtil.generarCodigoPresinto(
            despacho.getIdDespacho(),
            despacho.getNumeroManifiesto(),
            despacho.getFechaDespacho()
        );
    }

    private String generarNumeroManifiesto(Long idDespacho) {
        if (idDespacho == null || idDespacho <= 0) {
            throw new IllegalStateException("No se pudo generar numero de manifiesto: id de despacho inválido");
        }
        String codigoHex = String.format("%0" + PADDING_HEX_CODIGO + "X", idDespacho);
        return PREFIJO_NUMERO_MANIFIESTO + codigoHex;
    }


    @Transactional
    public DespachoDTO update(Long id, DespachoDTO dto) {
        Despacho despacho = despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
        assertDespachoAccesible(despacho);

        validarDespacho(dto);
        actualizarCamposBasicos(despacho, dto);
        actualizarAgencia(despacho, dto);
        actualizarDistribuidor(despacho, dto);
        actualizarDestinatarioDirecto(despacho, dto);
        if (dto.getCodigoPresinto() != null && !dto.getCodigoPresinto().isBlank()) {
            despacho.setCodigoPresinto(dto.getCodigoPresinto().trim());
        } else {
            despacho.setCodigoPresinto(calcularCodigoPresinto(despacho));
        }

        Despacho despachoGuardado = despachoRepository.save(despacho);

        // Actualizar sacas: eliminar las existentes y crear nuevas
        actualizarSacas(despachoGuardado, dto.getSacas());
        
        // Recargar el despacho para incluir las nuevas sacas en el DTO
        Despacho despachoActualizado = despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
        
        return toDTO(despachoActualizado);
    }
    
    private void actualizarSacas(Despacho despacho, List<SacaDTO> nuevasSacasDTO) {
        // Cargar sacas existentes con sus paquetes
        List<Saca> sacasExistentes = sacaRepository.findByDespachoIdDespacho(despacho.getIdDespacho());
        
        // Desasociar paquetes de todas las sacas existentes y cambiar su estado a RECIBIDO
        for (Saca sacaExistente : sacasExistentes) {
            desasociarPaquetesDeSaca(sacaExistente);
        }

        // Eliminar todas las sacas existentes usando consulta nativa para garantizar ejecución inmediata
        sacaRepository.deleteByDespachoIdDespacho(despacho.getIdDespacho());
        
        // Forzar flush para asegurar que las eliminaciones se persistan antes de crear nuevas
        sacaRepository.flush();
        
        if (nuevasSacasDTO != null && !nuevasSacasDTO.isEmpty()) {
            crearYAsignarSacas(despacho, nuevasSacasDTO);
        }
    }

    private void crearYAsignarSacas(Despacho despacho, List<SacaDTO> sacasDTO) {
        // Al eliminar y recrear sacas, la secuencia puede quedar desfasada en BD.
        // Se realinea antes de insertar para evitar colisiones de PK.
        alinearSecuenciaSaca();
        int numeroOrden = 1;
        for (SacaDTO sacaDTO : sacasDTO) {
            Saca saca = new Saca();
            saca.setDespacho(despacho);
            saca.setTamano(sacaDTO.getTamano());
            saca.setNumeroOrden(numeroOrden);
            saca.setFechaCreacion(LocalDateTime.now());

            Saca sacaGuardada = sacaRepository.save(saca);

            if (despacho.getNumeroManifiesto() == null || sacaGuardada.getNumeroOrden() == null) {
                throw new IllegalStateException("No se pudo generar el código QR: falta numeroManifiesto o numeroOrden");
            }
            String codigoQr = generarCodigoQrSaca(despacho.getNumeroManifiesto(), sacaGuardada.getNumeroOrden());
            sacaGuardada.setCodigoQr(codigoQr);
            sacaGuardada = sacaRepository.save(sacaGuardada);

            if (sacaDTO.getIdPaquetes() != null && !sacaDTO.getIdPaquetes().isEmpty()) {
                int ordenEnSaca = 1;
                for (Long idPaquete : sacaDTO.getIdPaquetes()) {
                    Paquete paquete = paqueteRepository.findById(idPaquete)
                        .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));
                    
                    PaqueteSaca ps = new PaqueteSaca();
                    ps.setId(new PaqueteSacaId(paquete.getIdPaquete(), sacaGuardada.getIdSaca()));
                    ps.setPaquete(paquete);
                    ps.setSaca(sacaGuardada);
                    ps.setOrdenEnSaca(ordenEnSaca);
                    
                    if (paquete.getPaqueteSacas() == null) paquete.setPaqueteSacas(new ArrayList<>());
                    paquete.getPaqueteSacas().add(ps);
                    
                    paquete.setEstado(EstadoPaquete.ASIGNADO_SACA);
                    paqueteRepository.save(paquete);
                    ordenEnSaca++;
                }
            }

            sacaGuardada.setPesoTotal(BigDecimal.ZERO);
            sacaGuardada.setFechaEnsacado(null);
            sacaRepository.save(sacaGuardada);

            numeroOrden++;
        }
    }

    private static String generarCodigoQrSaca(String numeroManifiesto, Integer numeroOrden) {
        String codigoDespacho = numeroManifiesto.substring(PREFIJO_NUMERO_MANIFIESTO.length());
        return PREFIJO_CODIGO_QR_SACA + codigoDespacho + "-" + String.format("%0" + PADDING_NUMERO_ORDEN_SACA + "d", numeroOrden);
    }

    private void alinearSecuenciaSaca() {
        jdbcTemplate.queryForObject(
                "SELECT setval(pg_get_serial_sequence('saca', 'id_saca'), COALESCE((SELECT MAX(id_saca) FROM saca), 0) + 1, false)",
                Long.class);
    }

    private void validarDespacho(DespachoDTO dto) {
        validarSacas(dto.getSacas());
        if (dto.getIdAgencia() != null && (dto.getIdDestinatarioDirecto() != null || dto.getIdPaqueteOrigenDestinatario() != null)) {
            throw new IllegalArgumentException("Un despacho no puede tener agencia y envío directo al mismo tiempo");
        }
        if (dto.getIdAgencia() == null
                && dto.getIdDestinatarioDirecto() == null
                && dto.getIdPaqueteOrigenDestinatario() == null) {
            throw new IllegalArgumentException("Debe indicar una agencia o un destinatario directo para el despacho");
        }
    }

    private void validarSacas(List<SacaDTO> sacas) {
        if (sacas == null || sacas.isEmpty()) {
            throw new IllegalArgumentException("Debe haber al menos una saca en el despacho");
        }
        for (SacaDTO sacaDTO : sacas) {
            if (sacaDTO.getIdPaquetes() == null || sacaDTO.getIdPaquetes().isEmpty()) {
                throw new IllegalArgumentException("Cada saca debe tener al menos un paquete");
            }
        }
    }

    private void actualizarCamposBasicos(Despacho despacho, DespachoDTO dto) {
        despacho.setFechaDespacho(dto.getFechaDespacho());
        if (agenciaScopeResolver.idAgenciaRestringida().isPresent()) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                despacho.setUsuarioRegistro(auth.getName());
            }
        } else {
            despacho.setUsuarioRegistro(dto.getUsuarioRegistro());
        }
        despacho.setObservaciones(dto.getObservaciones());
        despacho.setNumeroGuiaAgenciaDistribucion(dto.getNumeroGuiaAgenciaDistribucion());
    }

    private void actualizarAgencia(Despacho despacho, DespachoDTO dto) {
        if (dto.getIdAgencia() != null) {
            Agencia agencia = agenciaRepository.findById(dto.getIdAgencia())
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgencia()));
            despacho.setAgencia(agencia);
        } else {
            despacho.setAgencia(null);
        }
    }

    private void actualizarDistribuidor(Despacho despacho, DespachoDTO dto) {
        if (dto.getIdDistribuidor() != null) {
            Distribuidor distribuidor = distribuidorRepository.findById(dto.getIdDistribuidor())
                .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", dto.getIdDistribuidor()));
            despacho.setDistribuidor(distribuidor);
        } else {
            despacho.setDistribuidor(null);
        }
    }

    private void actualizarDestinatarioDirecto(Despacho despacho, DespachoDTO dto) {
        if (dto.getIdDestinatarioDirecto() != null) {
            DestinatarioDirecto destinatarioDirecto = destinatarioDirectoRepository
                .findById(dto.getIdDestinatarioDirecto())
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", dto.getIdDestinatarioDirecto()));
            despacho.setDestinatarioDirecto(destinatarioDirecto);
        } else if (dto.getIdPaqueteOrigenDestinatario() != null) {
            despacho.setDestinatarioDirecto(crearDestinatarioDesdePaquete(dto.getIdPaqueteOrigenDestinatario()));
        } else {
            despacho.setDestinatarioDirecto(null);
        }
    }

    private DestinatarioDirecto crearDestinatarioDesdePaquete(Long idPaqueteOrigenDestinatario) {
        Paquete paquete = paqueteRepository.findById(idPaqueteOrigenDestinatario)
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaqueteOrigenDestinatario));
        Cliente cliente = paquete.getClienteDestinatario();
        if (cliente == null) {
            throw new IllegalArgumentException("El paquete no tiene cliente destinatario");
        }
        DestinatarioDirecto nuevo = new DestinatarioDirecto();
        nuevo.setNombreDestinatario(cliente.getNombreCompleto() != null ? cliente.getNombreCompleto() : "Sin nombre");
        String telefono = (cliente.getTelefono() != null && !cliente.getTelefono().isBlank())
            ? cliente.getTelefono() : "N/A";
        nuevo.setTelefonoDestinatario(telefono);
        nuevo.setDireccionDestinatario(cliente.getDireccion());
        nuevo.setCanton(cliente.getProvincia() != null ? cliente.getProvincia() : cliente.getCanton());
        nuevo.setCodigo(cliente.getCanton());
        nuevo.setNombreEmpresa(null);
        nuevo.setFechaRegistro(LocalDateTime.now());
        nuevo.setActivo(true);
        return destinatarioDirectoRepository.save(nuevo);
    }

    @Transactional
    public void delete(Long id) {
        // Cargar despacho sin las colecciones anidadas para evitar MultipleBagFetchException
        Despacho despacho = despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
        assertDespachoAccesible(despacho);

        // Cargar sacas y paqueteSacas de forma separada para evitar MultipleBagFetchException
        if (despacho.getSacas() != null) {
            for (Saca saca : despacho.getSacas()) {
                if (saca.getPaqueteSacas() != null) {
                    saca.getPaqueteSacas().size(); // Forzar carga de la colección
                }
            }
        }
        
        desasociarPaquetesDeSacas(despacho);
        
        // Las sacas se eliminarán automáticamente por cascade, pero los paquetes ya están desasociados
        despachoRepository.delete(despacho);
    }

    private void desasociarPaquetesDeSacas(Despacho despacho) {
        if (despacho.getSacas() == null || despacho.getSacas().isEmpty()) {
            return;
        }

        for (Saca saca : despacho.getSacas()) {
            desasociarPaquetesDeSaca(saca);
        }
    }

    private void desasociarPaquetesDeSaca(Saca saca) {
        if (saca.getPaqueteSacas() == null || saca.getPaqueteSacas().isEmpty()) {
            return;
        }

        List<PaqueteSaca> asociaciones = new ArrayList<>(saca.getPaqueteSacas());
        for (PaqueteSaca ps : asociaciones) {
            Paquete paquete = ps.getPaquete();
            paquete.getPaqueteSacas().remove(ps);
            if (paquete.getPaqueteSacas().isEmpty()) {
                if (paquete.getEstado() == EstadoPaquete.ASIGNADO_SACA || paquete.getEstado() == EstadoPaquete.ENSACADO) {
                    paquete.setEstado(EstadoPaquete.RECIBIDO);
                    paquete.setFechaEnsacado(null);
                }
            }
            paqueteRepository.save(paquete);
        }
    }

    public void agregarSacas(Long idDespacho, List<Long> idSacas) {
        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        assertDespachoAccesible(despacho);

        for (Long idSaca : idSacas) {
            com.candas.candas_backend.entity.Saca saca = sacaRepository.findById(idSaca)
                .orElseThrow(() -> new ResourceNotFoundException("Saca", idSaca));
            saca.setDespacho(despacho);
            sacaRepository.save(saca);
        }
    }

    /**
     * Crea una saca en el despacho con todas las guías hijas (tipo CADENITA) del padre indicado.
     * El paquete padre se identifica por numeroGuia; solo los hijos se asignan a la saca.
     */
    public SacaDTO agregarCadenitaAlDespacho(Long idDespacho, String numeroGuiaPadre) {
        String numeroNorm = numeroGuiaPadre != null ? numeroGuiaPadre.trim().toUpperCase() : "";
        if (numeroNorm.isEmpty()) {
            throw new BadRequestException("El número de guía del padre es requerido");
        }

        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        assertDespachoAccesible(despacho);

        Paquete paquetePadre = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroNorm)
            .orElseThrow(() -> new BadRequestException("Guía padre no encontrada: " + numeroNorm));

        List<Paquete> hijos = paqueteRepository.findByPaquetePadreIdPaquete(paquetePadre.getIdPaquete());
        List<Paquete> hijosCadenita = hijos.stream()
            .filter(p -> TipoPaquete.CADENITA.equals(p.getTipoPaquete()))
            .collect(Collectors.toList());

        if (hijosCadenita.isEmpty()) {
            throw new BadRequestException("No hay guías hijas tipo CADENITA para esta guía padre");
        }

        List<String> yaEnSaca = hijosCadenita.stream()
            .filter(p -> p.getPaqueteSacas() != null && !p.getPaqueteSacas().isEmpty())
            .map(Paquete::getNumeroGuia)
            .collect(Collectors.toList());
        if (!yaEnSaca.isEmpty()) {
            throw new BadRequestException("Las siguientes guías hijas ya están asignadas a una saca: " + String.join(", ", yaEnSaca));
        }

        List<Saca> sacasActuales = sacaRepository.findByDespachoIdDespacho(idDespacho);
        int numeroOrden = sacasActuales.stream()
            .map(Saca::getNumeroOrden)
            .filter(o -> o != null)
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0) + 1;

        alinearSecuenciaSaca();
        Saca saca = new Saca();
        saca.setDespacho(despacho);
        saca.setNumeroOrden(numeroOrden);
        saca.setTamano(TamanoSaca.MEDIANO);
        saca.setFechaCreacion(LocalDateTime.now());
        saca.setPesoTotal(BigDecimal.ZERO);

        Saca sacaGuardada = sacaRepository.save(saca);

        if (despacho.getNumeroManifiesto() == null || sacaGuardada.getNumeroOrden() == null) {
            throw new IllegalStateException("No se pudo generar el código QR: falta numeroManifiesto o numeroOrden");
        }
        String codigoQr = generarCodigoQrSaca(despacho.getNumeroManifiesto(), sacaGuardada.getNumeroOrden());
        sacaGuardada.setCodigoQr(codigoQr);
        sacaGuardada = sacaRepository.save(sacaGuardada);

        int ordenEnSaca = 1;
        for (Paquete paquete : hijosCadenita) {
            PaqueteSaca ps = new PaqueteSaca();
            ps.setId(new PaqueteSacaId(paquete.getIdPaquete(), sacaGuardada.getIdSaca()));
            ps.setPaquete(paquete);
            ps.setSaca(sacaGuardada);
            ps.setOrdenEnSaca(ordenEnSaca);
            
            if (paquete.getPaqueteSacas() == null) paquete.setPaqueteSacas(new ArrayList<>());
            paquete.getPaqueteSacas().add(ps);
            
            paquete.setEstado(EstadoPaquete.ASIGNADO_SACA);
            paqueteRepository.save(paquete);
            ordenEnSaca++;
        }

        return sacaToSacaDTO(sacaGuardada, despacho);
    }

    public List<com.candas.candas_backend.dto.SacaDTO> obtenerSacas(Long idDespacho) {
        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        assertDespachoAccesible(despacho);

        // Cargar las sacas con sus paquetes usando fetch join
        List<com.candas.candas_backend.entity.Saca> sacasConPaquetes = sacaRepository.findByDespachoIdDespacho(idDespacho);
        
        return sacasConPaquetes.stream()
            .map(s -> {
                com.candas.candas_backend.dto.SacaDTO dto = new com.candas.candas_backend.dto.SacaDTO();
                dto.setIdSaca(s.getIdSaca());
                dto.setCodigoQr(s.getCodigoQr());
                dto.setNumeroOrden(s.getNumeroOrden());
                dto.setTamano(s.getTamano());
                dto.setPesoTotal(s.getPesoTotal());
                dto.setIdDespacho(despacho.getIdDespacho());
                dto.setNumeroManifiesto(despacho.getNumeroManifiesto());
                dto.setFechaCreacion(s.getFechaCreacion());
                dto.setFechaEnsacado(s.getFechaEnsacado());
                
                List<Paquete> paquetesOrdenados = s.getPaqueteSacas() != null ? s.getPaqueteSacas().stream()
                    .sorted(Comparator.comparing(PaqueteSaca::getOrdenEnSaca, Comparator.nullsLast(Integer::compareTo)))
                    .map(PaqueteSaca::getPaquete)
                    .collect(Collectors.toList()) : new ArrayList<>();
                    
                dto.setIdPaquetes(paquetesOrdenados.stream().map(Paquete::getIdPaquete).collect(java.util.stream.Collectors.toList()));
                
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public int marcarPaquetesComoDespachados(Long idDespacho) {
        Despacho despachoEntidad = despachoRepository.findById(idDespacho)
                .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        assertDespachoAccesible(despachoEntidad);

        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(idDespacho);
        int paquetesMarcados = 0;
        
        for (Saca saca : sacas) {
            if (saca.getPaqueteSacas() != null) {
                for (PaqueteSaca ps : saca.getPaqueteSacas()) {
                    Paquete paquete = ps.getPaquete();
                    if (paquete.getEstado() == EstadoPaquete.ENSACADO || 
                        paquete.getEstado() == EstadoPaquete.ASIGNADO_SACA) {
                        paquete.setEstado(EstadoPaquete.DESPACHADO);
                        paqueteRepository.save(paquete);
                        paquetesMarcados++;
                    }
                }
            }
        }
        
        return paquetesMarcados;
    }

    @Transactional
    public int marcarPaquetesComoDespachadosBatch(java.util.List<Long> idDespachos) {
        if (idDespachos == null || idDespachos.isEmpty()) {
            return 0;
        }
        int total = 0;
        for (Long idDespacho : idDespachos) {
            total += marcarPaquetesComoDespachados(idDespacho);
        }
        return total;
    }

    private DespachoDTO toDTO(Despacho despacho) {
        DespachoDTO dto = new DespachoDTO();
        dto.setIdDespacho(despacho.getIdDespacho());
        dto.setNumeroManifiesto(despacho.getNumeroManifiesto());
        dto.setFechaDespacho(despacho.getFechaDespacho());
        dto.setUsuarioRegistro(despacho.getUsuarioRegistro());
        dto.setObservaciones(despacho.getObservaciones());

        if (despacho.getAgencia() != null) {
            dto.setIdAgencia(despacho.getAgencia().getIdAgencia());
            dto.setNombreAgencia(despacho.getAgencia().getNombre());
            dto.setCantonAgencia(despacho.getAgencia().getCanton());
        }
        if (despacho.getDistribuidor() != null) {
            dto.setIdDistribuidor(despacho.getDistribuidor().getIdDistribuidor());
            dto.setNombreDistribuidor(despacho.getDistribuidor().getNombre());
        }
        dto.setNumeroGuiaAgenciaDistribucion(despacho.getNumeroGuiaAgenciaDistribucion());
        dto.setCodigoPresinto(despacho.getCodigoPresinto());

        mapearDespachoDirectoADTO(despacho, dto);
        dto.setSacas(mapearSacasADTO(despacho));
        return dto;
    }

    private void mapearDespachoDirectoADTO(Despacho despacho, DespachoDTO dto) {
        if (despacho.getDestinatarioDirecto() == null) {
            return;
        }
        DestinatarioDirecto dest = despacho.getDestinatarioDirecto();
        dto.setIdDestinatarioDirecto(dest.getIdDestinatarioDirecto());
        DespachoDirectoDTO despachoDirectoDTO = new DespachoDirectoDTO();
        despachoDirectoDTO.setIdDespacho(despacho.getIdDespacho());
        DestinatarioDirectoDTO destinatarioDTO = new DestinatarioDirectoDTO();
        destinatarioDTO.setIdDestinatarioDirecto(dest.getIdDestinatarioDirecto());
        destinatarioDTO.setNombreDestinatario(dest.getNombreDestinatario());
        destinatarioDTO.setTelefonoDestinatario(dest.getTelefonoDestinatario());
        destinatarioDTO.setDireccionDestinatario(dest.getDireccionDestinatario());
        destinatarioDTO.setCanton(dest.getCanton());
        destinatarioDTO.setNombreEmpresa(dest.getNombreEmpresa());
        destinatarioDTO.setFechaRegistro(dest.getFechaRegistro());
        destinatarioDTO.setActivo(dest.getActivo());
        despachoDirectoDTO.setDestinatarioDirecto(destinatarioDTO);
        dto.setDespachoDirecto(despachoDirectoDTO);
    }

    private List<SacaDTO> mapearSacasADTO(Despacho despacho) {
        if (despacho.getSacas() == null || despacho.getSacas().isEmpty()) {
            return List.of();
        }
        return despacho.getSacas().stream()
                .map(s -> sacaToSacaDTO(s, despacho))
                .collect(java.util.stream.Collectors.toList());
    }

    private SacaDTO sacaToSacaDTO(Saca s, Despacho despacho) {
        if ((s.getCodigoQr() == null || s.getCodigoQr().isEmpty())
                && despacho.getNumeroManifiesto() != null && s.getNumeroOrden() != null) {
            s.setCodigoQr(generarCodigoQrSaca(despacho.getNumeroManifiesto(), s.getNumeroOrden()));
            s = sacaRepository.save(s);
        }
        SacaDTO sacaDTO = new SacaDTO();
        sacaDTO.setIdSaca(s.getIdSaca());
        sacaDTO.setCodigoQr(s.getCodigoQr());
        sacaDTO.setNumeroOrden(s.getNumeroOrden());
        sacaDTO.setTamano(s.getTamano());
        sacaDTO.setPesoTotal(s.getPesoTotal());
        sacaDTO.setFechaCreacion(s.getFechaCreacion());
        sacaDTO.setFechaEnsacado(s.getFechaEnsacado());
        sacaDTO.setIdDespacho(despacho.getIdDespacho());
        sacaDTO.setNumeroManifiesto(despacho.getNumeroManifiesto());
        
        List<Paquete> paquetesOrdenados = s.getPaqueteSacas() != null ? s.getPaqueteSacas().stream()
            .sorted(Comparator.comparing(PaqueteSaca::getOrdenEnSaca, Comparator.nullsLast(Integer::compareTo)))
            .map(PaqueteSaca::getPaquete)
            .collect(Collectors.toList()) : new ArrayList<>();
            
        sacaDTO.setIdPaquetes(paquetesOrdenados.stream().map(Paquete::getIdPaquete).collect(java.util.stream.Collectors.toList()));
        return sacaDTO;
    }

    private Despacho toEntity(DespachoDTO dto) {
        Despacho despacho = new Despacho();
        // numeroManifiesto se genera automáticamente en create()
        despacho.setFechaDespacho(dto.getFechaDespacho());
        despacho.setUsuarioRegistro(dto.getUsuarioRegistro());
        despacho.setObservaciones(dto.getObservaciones());
        if (dto.getCodigoPresinto() != null && !dto.getCodigoPresinto().isBlank()) {
            despacho.setCodigoPresinto(dto.getCodigoPresinto().trim());
        }
        // Las relaciones y sacas se manejan en create()
        return despacho;
    }

}
