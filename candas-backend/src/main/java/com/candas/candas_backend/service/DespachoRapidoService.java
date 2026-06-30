package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.ActualizarDestinoDespachoRapidoDTO;
import com.candas.candas_backend.dto.ActualizarPresintoSacaDTO;
import com.candas.candas_backend.dto.AgregarPaqueteRapidoDTO;
import com.candas.candas_backend.dto.CrearDespachoRapidoDTO;
import com.candas.candas_backend.dto.CrearSacaRapidaDTO;
import com.candas.candas_backend.dto.DespachoRapidoDTO;
import com.candas.candas_backend.dto.DespachoRapidoPaqueteDTO;
import com.candas.candas_backend.dto.DespachoRapidoSacaDTO;
import com.candas.candas_backend.dto.FinalizarDespachoRapidoDTO;
import com.candas.candas_backend.dto.MoverPaqueteRapidoDTO;
import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.Cliente;
import com.candas.candas_backend.entity.DestinatarioDirecto;
import com.candas.candas_backend.entity.Despacho;
import com.candas.candas_backend.entity.Distribuidor;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.PaqueteSaca;
import com.candas.candas_backend.entity.PaqueteSacaId;
import com.candas.candas_backend.entity.Saca;
import com.candas.candas_backend.entity.TelefonoAgencia;
import com.candas.candas_backend.entity.Usuario;
import com.candas.candas_backend.entity.enums.EstadoDespacho;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TamanoSaca;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.AgenciaRepository;
import com.candas.candas_backend.repository.DespachoRepository;
import com.candas.candas_backend.repository.DestinatarioDirectoRepository;
import com.candas.candas_backend.repository.DistribuidorRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import com.candas.candas_backend.repository.SacaRepository;
import com.candas.candas_backend.repository.UsuarioRepository;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import com.candas.candas_backend.util.PresintoUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Reglas de negocio del módulo "Despachos rápidos" (MVP 1/4).
 *
 * Maneja el ciclo de vida BORRADOR -> EN_ENSACADO -> LISTO_PARA_GUIA -> FINALIZADO sobre las
 * entidades existentes ({@link Despacho}, {@link Saca}, {@link PaqueteSaca}, {@link Paquete}),
 * de forma aislada del flujo clásico ({@code DespachoService}) y de {@code /despachos/masivo}.
 *
 * Características del flujo:
 * <ul>
 *   <li>Un despacho puede crearse sin destino ni guía de distribuidor (BORRADOR).</li>
 *   <li>Agregar un paquete lo reserva en una saca (estado {@code ASIGNADO_SACA}); un paquete ya
 *       reservado en otra saca no puede agregarse de nuevo.</li>
 *   <li>El destino (agencia o destinatario directo) es obligatorio antes de LISTO_PARA_GUIA.</li>
 *   <li>La guía externa ({@code numeroGuiaAgenciaDistribucion}) se asigna al finalizar; otro
 *       dispositivo de la misma cuenta puede finalizarlo después.</li>
 * </ul>
 */
@Service
@Transactional
public class DespachoRapidoService {

    private static final String PREFIJO_NUMERO_MANIFIESTO = "MAN-";
    private static final String PREFIJO_CODIGO_QR_SACA = "SAC-";
    private static final int PADDING_HEX_CODIGO = 8;
    private static final int PADDING_NUMERO_ORDEN_SACA = 2;

    private static final List<EstadoDespacho> ESTADOS_ACTIVOS =
        List.of(EstadoDespacho.BORRADOR, EstadoDespacho.EN_ENSACADO, EstadoDespacho.LISTO_PARA_GUIA);

    private final DespachoRepository despachoRepository;
    private final SacaRepository sacaRepository;
    private final PaqueteRepository paqueteRepository;
    private final AgenciaRepository agenciaRepository;
    private final DistribuidorRepository distribuidorRepository;
    private final DestinatarioDirectoRepository destinatarioDirectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgenciaScopeResolver agenciaScopeResolver;
    private final PresintoUtil presintoUtil;
    private final JdbcTemplate jdbcTemplate;
    private final DespachoService despachoService;

    public DespachoRapidoService(
            DespachoRepository despachoRepository,
            SacaRepository sacaRepository,
            PaqueteRepository paqueteRepository,
            AgenciaRepository agenciaRepository,
            DistribuidorRepository distribuidorRepository,
            DestinatarioDirectoRepository destinatarioDirectoRepository,
            UsuarioRepository usuarioRepository,
            AgenciaScopeResolver agenciaScopeResolver,
            PresintoUtil presintoUtil,
            JdbcTemplate jdbcTemplate,
            DespachoService despachoService) {
        this.despachoRepository = despachoRepository;
        this.sacaRepository = sacaRepository;
        this.paqueteRepository = paqueteRepository;
        this.agenciaRepository = agenciaRepository;
        this.distribuidorRepository = distribuidorRepository;
        this.destinatarioDirectoRepository = destinatarioDirectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.agenciaScopeResolver = agenciaScopeResolver;
        this.presintoUtil = presintoUtil;
        this.jdbcTemplate = jdbcTemplate;
        this.despachoService = despachoService;
    }

    // ---------------------------------------------------------------------
    // Consultas
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<DespachoRapidoDTO> listar(EstadoDespacho estadoFiltro) {
        Collection<EstadoDespacho> estados = estadoFiltro != null ? List.of(estadoFiltro) : ESTADOS_ACTIVOS;
        Optional<Long> idAgencia = agenciaScopeResolver.idAgenciaRestringida();
        List<Despacho> despachos = idAgencia.isPresent()
            ? despachoRepository.findByEstadoInAndAgenciaPropietaria_IdAgenciaOrderByFechaDespachoDesc(estados, idAgencia.get())
            : despachoRepository.findByEstadoInOrderByFechaDespachoDesc(estados);
        return despachos.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DespachoRapidoDTO obtener(Long id) {
        return toDTO(cargarAccesible(id));
    }

    // ---------------------------------------------------------------------
    // Ciclo de vida
    // ---------------------------------------------------------------------

    public DespachoRapidoDTO crear(CrearDespachoRapidoDTO dto) {
        Optional<Long> idAgenciaPropietaria = agenciaScopeResolver.requireAgenciaOrigenActivaParaCreacion();
        validarDestinoExcluyente(dto.getIdAgencia(), dto.getIdDestinatarioDirecto(), dto.getIdPaqueteOrigenDestinatario());

        Despacho despacho = new Despacho();
        despacho.setFechaDespacho(LocalDateTime.now());
        despacho.setEstado(EstadoDespacho.BORRADOR);
        despacho.setUsuarioRegistro(usuarioAutenticado());
        despacho.setObservaciones(dto.getObservaciones());
        idAgenciaPropietaria.flatMap(agenciaRepository::findById).ifPresent(despacho::setAgenciaPropietaria);

        aplicarDestino(despacho, dto.getIdAgencia(), dto.getIdDestinatarioDirecto(), dto.getIdPaqueteOrigenDestinatario());
        aplicarDistribuidor(despacho, dto.getIdDistribuidor());

        Despacho guardado = despachoRepository.save(despacho);
        if (guardado.getNumeroManifiesto() == null || guardado.getNumeroManifiesto().isBlank()) {
            guardado.setNumeroManifiesto(generarNumeroManifiesto(guardado.getIdDespacho()));
            guardado = despachoRepository.save(guardado);
        }
        return toDTO(recargar(guardado.getIdDespacho()));
    }

    public DespachoRapidoDTO actualizarDestino(Long id, ActualizarDestinoDespachoRapidoDTO dto) {
        Despacho despacho = cargarAccesible(id);
        if (despacho.getEstado() == EstadoDespacho.FINALIZADO) {
            throw new BadRequestException("El despacho ya está finalizado; actualiza la pantalla antes de continuar");
        }
        boolean tocaDestino = dto.getIdAgencia() != null || dto.getIdDestinatarioDirecto() != null
                || dto.getIdPaqueteOrigenDestinatario() != null;
        if (!tocaDestino && dto.getIdDistribuidor() == null) {
            throw new BadRequestException("No hay datos de destino ni distribuidor para actualizar");
        }
        if (tocaDestino) {
            validarDestinoExcluyente(dto.getIdAgencia(), dto.getIdDestinatarioDirecto(), dto.getIdPaqueteOrigenDestinatario());
            aplicarDestino(despacho, dto.getIdAgencia(), dto.getIdDestinatarioDirecto(), dto.getIdPaqueteOrigenDestinatario());
        }
        aplicarDistribuidor(despacho, dto.getIdDistribuidor());
        despachoRepository.save(despacho);
        return toDTO(recargar(id));
    }

    public DespachoRapidoDTO agregarPaquete(Long id, AgregarPaqueteRapidoDTO dto) {
        Despacho despacho = cargarAccesible(id);
        assertEditable(despacho);

        String guia = normalizarNumeroGuia(dto.getNumeroGuia());
        if (guia.isEmpty()) {
            throw new BadRequestException("El número de guía es obligatorio");
        }
        Paquete paquete = resolverOCrearPaquete(dto.getIdPaquete(), guia);

        // Reserva: un paquete ya asignado a una saca no puede agregarse a otro despacho/saca.
        if (paquete.getPaqueteSacas() != null && !paquete.getPaqueteSacas().isEmpty()) {
            boolean reservadoEnEsteDespacho = paquete.getPaqueteSacas().stream()
                .anyMatch(ps -> ps.getSaca() != null
                    && ps.getSaca().getDespacho() != null
                    && id.equals(ps.getSaca().getDespacho().getIdDespacho()));
            if (reservadoEnEsteDespacho) {
                throw new BadRequestException("La guia " + paquete.getNumeroGuia()
                    + " ya esta agregada a este despacho");
            }
            throw new BadRequestException("Paquete ya reservado: la guia " + paquete.getNumeroGuia()
                + " ya esta en una saca de otro despacho");
        }
        if (paquete.getEstado() == EstadoPaquete.DESPACHADO) {
            throw new BadRequestException("La guía " + paquete.getNumeroGuia() + " ya fue despachada");
        }

        Saca saca = resolverSacaDestino(despacho, dto.getIdSaca(), dto.getTamanoSaca());
        reservarPaqueteEnSaca(paquete, saca);

        marcarEnEnsacadoSiCapturaContinua(despacho);
        return toDTO(recargar(id));
    }

    public DespachoRapidoDTO moverPaquete(Long id, MoverPaqueteRapidoDTO dto) {
        Despacho despacho = cargarAccesible(id);
        assertEditable(despacho);

        Paquete paquete = resolverPaquete(dto.getIdPaquete(), dto.getNumeroGuia());

        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(id);
        Set<Long> idsSacaDespacho = sacas.stream().map(Saca::getIdSaca).collect(Collectors.toSet());

        Saca destino = sacas.stream()
            .filter(s -> s.getIdSaca().equals(dto.getIdSacaDestino()))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("La saca destino no pertenece a este despacho"));

        PaqueteSaca asociacionActual = paquete.getPaqueteSacas() == null ? null : paquete.getPaqueteSacas().stream()
            .filter(ps -> ps.getSaca() != null && idsSacaDespacho.contains(ps.getSaca().getIdSaca()))
            .findFirst()
            .orElse(null);
        if (asociacionActual == null) {
            throw new BadRequestException("La guía " + paquete.getNumeroGuia() + " no está reservada en este despacho");
        }
        if (asociacionActual.getSaca().getIdSaca().equals(destino.getIdSaca())) {
            return toDTO(recargar(id)); // ya está en la saca destino
        }

        // Quitar de la saca origen (orphanRemoval elimina la fila) y reasignar a la destino.
        paquete.getPaqueteSacas().removeIf(ps -> ps.getSaca() != null
            && ps.getSaca().getIdSaca().equals(asociacionActual.getSaca().getIdSaca()));
        paqueteRepository.saveAndFlush(paquete);

        reservarPaqueteEnSaca(paquete, destino);
        marcarEnEnsacadoSiCapturaContinua(despacho);
        return toDTO(recargar(id));
    }

    public DespachoRapidoDTO marcarListoParaGuia(Long id) {
        Despacho despacho = cargarAccesible(id);
        if (despacho.getEstado() == EstadoDespacho.LISTO_PARA_GUIA) {
            return toDTO(recargar(id)); // idempotente
        }
        if (despacho.getEstado() != EstadoDespacho.BORRADOR && despacho.getEstado() != EstadoDespacho.EN_ENSACADO) {
            throw new BadRequestException("No se puede marcar listo para guía desde el estado " + despacho.getEstado());
        }
        if (despacho.getAgencia() == null && despacho.getDestinatarioDirecto() == null) {
            throw new BadRequestException("Destino faltante: define una agencia o destinatario directo antes de marcar listo para guía");
        }
        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(id);
        boolean tienePaquetes = sacas.stream()
            .anyMatch(s -> s.getPaqueteSacas() != null && !s.getPaqueteSacas().isEmpty());
        if (!tienePaquetes) {
            throw new BadRequestException("Saca vacía: agrega al menos un paquete antes de marcar listo para guía");
        }
        despacho.setEstado(EstadoDespacho.LISTO_PARA_GUIA);
        despachoRepository.save(despacho);
        return toDTO(recargar(id));
    }

    public DespachoRapidoDTO finalizar(Long id, FinalizarDespachoRapidoDTO dto) {
        Despacho despacho = cargarAccesible(id);
        if (despacho.getEstado() == EstadoDespacho.FINALIZADO) {
            throw new BadRequestException("El despacho ya está finalizado; actualiza la pantalla antes de continuar");
        }
        if (despacho.getEstado() != EstadoDespacho.LISTO_PARA_GUIA) {
            throw new BadRequestException("Despacho no listo: solo se puede finalizar cuando está LISTO_PARA_GUIA (actual: "
                + despacho.getEstado() + ")");
        }
        String guia = dto.getNumeroGuiaAgenciaDistribucion() != null ? dto.getNumeroGuiaAgenciaDistribucion().trim() : "";
        if (guia.isEmpty()) {
            throw new BadRequestException("Guía externa faltante: ingresa el número de guía del distribuidor para finalizar");
        }
        aplicarDistribuidor(despacho, dto.getIdDistribuidor());
        despacho.setNumeroGuiaAgenciaDistribucion(guia);
        despacho.setEstado(EstadoDespacho.FINALIZADO);
        despachoRepository.save(despacho);
        return toDTO(recargar(id));
    }

    // ---------------------------------------------------------------------
    // Sacas
    // ---------------------------------------------------------------------

    /** Crea una saca nueva (vacía) en el despacho para "cambiar" la saca activa. */
    public DespachoRapidoDTO crearSacaEnDespacho(Long id, CrearSacaRapidaDTO dto) {
        Despacho despacho = cargarAccesible(id);
        assertEditable(despacho);
        Saca saca = crearSaca(despacho, dto != null ? dto.getTamanoSaca() : null);
        if (dto != null && dto.getCodigoPresinto() != null && !dto.getCodigoPresinto().isBlank()) {
            saca.setCodigoPresinto(dto.getCodigoPresinto().trim());
            sacaRepository.save(saca);
        }
        marcarEnEnsacadoSiCapturaContinua(despacho);
        return toDTO(recargar(id));
    }

    /** Ingresa/actualiza el presinto (sello físico) de una saca del despacho. */
    public DespachoRapidoDTO actualizarPresintoSaca(Long id, Long idSaca, ActualizarPresintoSacaDTO dto) {
        Despacho despacho = cargarAccesible(id);
        assertEditable(despacho);
        String presinto = dto != null && dto.getCodigoPresinto() != null ? dto.getCodigoPresinto().trim() : "";
        if (presinto.isEmpty()) {
            throw new BadRequestException("El presinto es obligatorio");
        }
        Saca saca = sacaRepository.findByDespachoIdDespacho(id).stream()
            .filter(s -> s.getIdSaca().equals(idSaca))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("La saca " + idSaca + " no pertenece a este despacho"));
        saca.setCodigoPresinto(presinto);
        sacaRepository.save(saca);
        marcarEnEnsacadoSiCapturaContinua(despacho);
        return toDTO(recargar(id));
    }

    // ---------------------------------------------------------------------
    // Helpers de dominio
    // ---------------------------------------------------------------------

    private void reservarPaqueteEnSaca(Paquete paquete, Saca saca) {
        int orden = siguienteOrdenEnSaca(saca);
        PaqueteSaca ps = new PaqueteSaca();
        ps.setId(new PaqueteSacaId(paquete.getIdPaquete(), saca.getIdSaca()));
        ps.setPaquete(paquete);
        ps.setSaca(saca);
        ps.setOrdenEnSaca(orden);
        if (paquete.getPaqueteSacas() == null) {
            paquete.setPaqueteSacas(new ArrayList<>());
        }
        paquete.getPaqueteSacas().add(ps);
        paquete.setEstado(EstadoPaquete.ASIGNADO_SACA);
        paqueteRepository.save(paquete);
    }

    private Paquete resolverOCrearPaquete(Long idPaquete, String guiaNormalizada) {
        if (idPaquete != null) {
            Paquete paquete = paqueteRepository.findById(idPaquete)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));
            String guiaPaquete = normalizarNumeroGuia(paquete.getNumeroGuia());
            if (!guiaPaquete.equals(guiaNormalizada)) {
                throw new BadRequestException("El paquete resuelto no coincide con la guia " + guiaNormalizada);
            }
            return paquete;
        }

        return paqueteRepository.findByNumeroGuiaIgnoreCase(guiaNormalizada)
            .orElseGet(() -> crearPaqueteSimplificadoParaDespachoRapido(guiaNormalizada));
    }

    private Paquete crearPaqueteSimplificadoParaDespachoRapido(String guiaNormalizada) {
        jdbcTemplate.update("""
            INSERT INTO paquete (numero_guia, estado, fecha_registro, observaciones)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (numero_guia) DO NOTHING
            """,
            guiaNormalizada,
            EstadoPaquete.REGISTRADO.name(),
            LocalDateTime.now(),
            "Creado desde Despachos rapidos");
        return paqueteRepository.findByNumeroGuiaIgnoreCase(guiaNormalizada)
            .orElseThrow(() -> new BadRequestException("No se pudo resolver la guia " + guiaNormalizada));
    }

    private void marcarEnEnsacadoSiCapturaContinua(Despacho despacho) {
        if (despacho.getEstado() == EstadoDespacho.BORRADOR
                || despacho.getEstado() == EstadoDespacho.LISTO_PARA_GUIA) {
            despacho.setEstado(EstadoDespacho.EN_ENSACADO);
            despachoRepository.save(despacho);
        }
    }

    private int siguienteOrdenEnSaca(Saca saca) {
        if (saca.getPaqueteSacas() == null || saca.getPaqueteSacas().isEmpty()) {
            return 1;
        }
        return saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getOrdenEnSaca)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0) + 1;
    }

    private Saca resolverSacaDestino(Despacho despacho, Long idSaca, TamanoSaca tamano) {
        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(despacho.getIdDespacho());
        if (idSaca != null) {
            return sacas.stream()
                .filter(s -> s.getIdSaca().equals(idSaca))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("La saca " + idSaca + " no pertenece a este despacho"));
        }
        if (!sacas.isEmpty()) {
            return sacas.stream()
                .max(Comparator.comparing(Saca::getNumeroOrden, Comparator.nullsLast(Integer::compareTo)))
                .orElseThrow();
        }
        return crearSaca(despacho, tamano);
    }

    private Saca crearSaca(Despacho despacho, TamanoSaca tamano) {
        List<Saca> existentes = sacaRepository.findByDespachoIdDespacho(despacho.getIdDespacho());
        int numeroOrden = existentes.stream()
            .map(Saca::getNumeroOrden)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0) + 1;

        alinearSecuenciaSaca();
        Saca saca = new Saca();
        saca.setDespacho(despacho);
        saca.setNumeroOrden(numeroOrden);
        saca.setTamano(tamano != null ? tamano : TamanoSaca.MEDIANO);
        saca.setFechaCreacion(LocalDateTime.now());
        saca.setPesoTotal(BigDecimal.ZERO);

        Saca guardada = sacaRepository.save(saca);
        if (despacho.getNumeroManifiesto() == null || guardada.getNumeroOrden() == null) {
            throw new IllegalStateException("No se pudo generar el código QR: falta numeroManifiesto o numeroOrden");
        }
        guardada.setCodigoQr(generarCodigoQrSaca(despacho.getNumeroManifiesto(), guardada.getNumeroOrden()));
        guardada = sacaRepository.save(guardada);
        guardada.setCodigoPresinto(presintoUtil.generarCodigoPresintoSaca(
            despacho.getIdDespacho(), despacho.getNumeroManifiesto(),
            guardada.getIdSaca(), guardada.getNumeroOrden(), guardada.getFechaCreacion()));
        return sacaRepository.save(guardada);
    }

    private void aplicarDestino(Despacho despacho, Long idAgencia, Long idDestinatarioDirecto, Long idPaqueteOrigen) {
        if (idAgencia != null) {
            Agencia agencia = agenciaRepository.findById(idAgencia)
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", idAgencia));
            despacho.setAgencia(agencia);
            despacho.setDestinatarioDirecto(null);
        } else if (idDestinatarioDirecto != null) {
            DestinatarioDirecto destinatario = destinatarioDirectoRepository.findById(idDestinatarioDirecto)
                .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto", idDestinatarioDirecto));
            despacho.setDestinatarioDirecto(destinatario);
            despacho.setAgencia(null);
        } else if (idPaqueteOrigen != null) {
            despacho.setDestinatarioDirecto(crearDestinatarioDesdePaquete(idPaqueteOrigen));
            despacho.setAgencia(null);
        }
        // Si los tres son nulos, no se modifica el destino (permite seguir en BORRADOR sin destino).
    }

    private void aplicarDistribuidor(Despacho despacho, Long idDistribuidor) {
        if (idDistribuidor != null) {
            Distribuidor distribuidor = distribuidorRepository.findById(idDistribuidor)
                .orElseThrow(() -> new ResourceNotFoundException("Distribuidor", idDistribuidor));
            despacho.setDistribuidor(distribuidor);
        }
    }

    private void validarDestinoExcluyente(Long idAgencia, Long idDestinatarioDirecto, Long idPaqueteOrigen) {
        if (idAgencia != null && (idDestinatarioDirecto != null || idPaqueteOrigen != null)) {
            throw new BadRequestException("Un despacho no puede tener agencia y destinatario directo al mismo tiempo");
        }
    }

    private DestinatarioDirecto crearDestinatarioDesdePaquete(Long idPaqueteOrigenDestinatario) {
        Paquete paquete = paqueteRepository.findById(idPaqueteOrigenDestinatario)
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaqueteOrigenDestinatario));
        Cliente cliente = paquete.getClienteDestinatario();
        if (cliente == null) {
            throw new BadRequestException("El paquete no tiene cliente destinatario");
        }
        DestinatarioDirecto nuevo = new DestinatarioDirecto();
        nuevo.setNombreDestinatario(cliente.getNombreCompleto() != null ? cliente.getNombreCompleto() : "Sin nombre");
        nuevo.setTelefonoDestinatario((cliente.getTelefono() != null && !cliente.getTelefono().isBlank())
            ? cliente.getTelefono() : "N/A");
        nuevo.setDireccionDestinatario(cliente.getDireccion());
        nuevo.setCanton(cliente.getProvincia() != null ? cliente.getProvincia() : cliente.getCanton());
        nuevo.setCodigo(cliente.getCanton());
        nuevo.setNombreEmpresa(null);
        nuevo.setFechaRegistro(LocalDateTime.now());
        nuevo.setActivo(true);
        return destinatarioDirectoRepository.save(nuevo);
    }

    private void assertEditable(Despacho despacho) {
        if (despacho.getEstado() != EstadoDespacho.BORRADOR
                && despacho.getEstado() != EstadoDespacho.EN_ENSACADO
                && despacho.getEstado() != EstadoDespacho.LISTO_PARA_GUIA) {
            throw new BadRequestException("El despacho ya no admite cambios de paquetes (estado actual: "
                + despacho.getEstado() + "); actualiza la pantalla antes de continuar");
        }
    }

    private Paquete resolverPaquete(Long idPaquete, String numeroGuia) {
        if (idPaquete != null) {
            return paqueteRepository.findById(idPaquete)
                .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));
        }
        if (numeroGuia != null && !numeroGuia.isBlank()) {
            String guia = normalizarNumeroGuia(numeroGuia);
            return paqueteRepository.findByNumeroGuiaIgnoreCase(guia)
                .orElseThrow(() -> new BadRequestException("Guia no encontrada: " + guia));
        }
        throw new BadRequestException("Debe indicar idPaquete o numeroGuia");
    }


    private static String normalizarNumeroGuia(String numeroGuia) {
        return numeroGuia == null ? "" : numeroGuia.trim().toUpperCase();
    }

    // ---------------------------------------------------------------------
    // Acceso por agencia
    // ---------------------------------------------------------------------

    private Despacho cargarAccesible(Long id) {
        Despacho despacho = despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
        assertAccesible(despacho);
        return despacho;
    }

    private void assertAccesible(Despacho despacho) {
        agenciaScopeResolver.idAgenciaRestringida().ifPresent(idAgencia -> {
            boolean visible = despacho.getAgenciaPropietaria() != null
                && idAgencia.equals(despacho.getAgenciaPropietaria().getIdAgencia());
            if (!visible) {
                throw new AgenciaAccessDeniedException(
                    "No tienes acceso a este despacho desde tu agencia origen activa.");
            }
        });
    }

    private Despacho recargar(Long id) {
        return despachoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", id));
    }

    // ---------------------------------------------------------------------
    // Generadores (réplica local de los formatos del flujo clásico, para aislar el módulo)
    // ---------------------------------------------------------------------

    private String generarNumeroManifiesto(Long idDespacho) {
        if (idDespacho == null || idDespacho <= 0) {
            throw new IllegalStateException("No se pudo generar numero de manifiesto: id de despacho inválido");
        }
        return PREFIJO_NUMERO_MANIFIESTO + String.format("%0" + PADDING_HEX_CODIGO + "X", idDespacho);
    }

    private static String generarCodigoQrSaca(String numeroManifiesto, Integer numeroOrden) {
        String codigoDespacho = numeroManifiesto.substring(PREFIJO_NUMERO_MANIFIESTO.length());
        return PREFIJO_CODIGO_QR_SACA + codigoDespacho + "-"
            + String.format("%0" + PADDING_NUMERO_ORDEN_SACA + "d", numeroOrden);
    }

    private void alinearSecuenciaSaca() {
        jdbcTemplate.queryForObject(
            "SELECT setval(pg_get_serial_sequence('saca', 'id_saca'), COALESCE((SELECT MAX(id_saca) FROM saca), 0) + 1, false)",
            Long.class);
    }

    // ---------------------------------------------------------------------
    // Mapeo a DTO
    // ---------------------------------------------------------------------

    private DespachoRapidoDTO toDTO(Despacho despacho) {
        DespachoRapidoDTO dto = new DespachoRapidoDTO();
        dto.setIdDespacho(despacho.getIdDespacho());
        dto.setNumeroManifiesto(despacho.getNumeroManifiesto());
        dto.setEstado(despacho.getEstado());
        dto.setFechaDespacho(despacho.getFechaDespacho());
        dto.setUsuarioRegistro(nombreVisibleUsuario(despacho.getUsuarioRegistro()));
        dto.setObservaciones(despacho.getObservaciones());

        if (despacho.getAgencia() != null) {
            dto.setIdAgencia(despacho.getAgencia().getIdAgencia());
            dto.setNombreAgencia(despacho.getAgencia().getNombre());
            dto.setCodigoAgencia(despacho.getAgencia().getCodigo());
            dto.setTelefonoAgencia(telefonoPrincipalAgencia(despacho.getAgencia()));
            dto.setDireccionAgencia(despacho.getAgencia().getDireccion());
            dto.setCantonAgencia(despacho.getAgencia().getCanton());
        }
        if (despacho.getDestinatarioDirecto() != null) {
            dto.setIdDestinatarioDirecto(despacho.getDestinatarioDirecto().getIdDestinatarioDirecto());
            dto.setNombreDestinatarioDirecto(despacho.getDestinatarioDirecto().getNombreDestinatario());
            dto.setCodigoDestinatarioDirecto(despacho.getDestinatarioDirecto().getCodigo());
            dto.setTelefonoDestinatarioDirecto(despacho.getDestinatarioDirecto().getTelefonoDestinatario());
            dto.setDireccionDestinatarioDirecto(despacho.getDestinatarioDirecto().getDireccionDestinatario());
            dto.setCantonDestinatarioDirecto(despacho.getDestinatarioDirecto().getCanton());
            dto.setNombreEmpresaDestinatarioDirecto(despacho.getDestinatarioDirecto().getNombreEmpresa());
        }
        if (despacho.getAgenciaPropietaria() != null) {
            dto.setIdAgenciaPropietaria(despacho.getAgenciaPropietaria().getIdAgencia());
            dto.setNombreAgenciaPropietaria(despacho.getAgenciaPropietaria().getNombre());
        }
        if (despacho.getDistribuidor() != null) {
            dto.setIdDistribuidor(despacho.getDistribuidor().getIdDistribuidor());
            dto.setNombreDistribuidor(despacho.getDistribuidor().getNombre());
        }
        dto.setNumeroGuiaAgenciaDistribucion(despacho.getNumeroGuiaAgenciaDistribucion());

        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(despacho.getIdDespacho());
        sacas.sort(Comparator.comparing(Saca::getNumeroOrden, Comparator.nullsLast(Integer::compareTo)));

        List<DespachoRapidoSacaDTO> sacaDTOs = new ArrayList<>();
        int totalPaquetes = 0;
        for (Saca saca : sacas) {
            List<DespachoRapidoPaqueteDTO> paquetes = saca.getPaqueteSacas() == null ? new ArrayList<>()
                : saca.getPaqueteSacas().stream()
                    .sorted(Comparator.comparing(PaqueteSaca::getOrdenEnSaca, Comparator.nullsLast(Integer::compareTo)))
                    .map(ps -> toPaqueteDTO(ps.getPaquete(), ps.getOrdenEnSaca()))
                    .collect(Collectors.toList());
            totalPaquetes += paquetes.size();

            DespachoRapidoSacaDTO sacaDTO = new DespachoRapidoSacaDTO();
            sacaDTO.setIdSaca(saca.getIdSaca());
            sacaDTO.setNumeroOrden(saca.getNumeroOrden());
            sacaDTO.setCodigoQr(saca.getCodigoQr());
            sacaDTO.setTamano(saca.getTamano());
            sacaDTO.setCodigoPresinto(saca.getCodigoPresinto());
            sacaDTO.setPaquetes(paquetes);
            sacaDTOs.add(sacaDTO);
        }

        dto.setSacas(sacaDTOs);
        dto.setTotalSacas(sacaDTOs.size());
        dto.setTotalPaquetes(totalPaquetes);
        return dto;
    }

    private DespachoRapidoPaqueteDTO toPaqueteDTO(Paquete paquete, Integer ordenEnSaca) {
        DespachoRapidoPaqueteDTO dto = new DespachoRapidoPaqueteDTO();
        dto.setIdPaquete(paquete.getIdPaquete());
        dto.setNumeroGuia(paquete.getNumeroGuia());
        dto.setEstado(paquete.getEstado());
        dto.setOrdenEnSaca(ordenEnSaca);
        dto.setTipoPaquete(paquete.getTipoPaquete());
        dto.setTipoDestino(paquete.getTipoDestino());
        dto.setPesoKilos(paquete.getPesoKilos());
        dto.setRef(paquete.getRef());
        dto.setObservaciones(paquete.getObservaciones());

        if (paquete.getClienteDestinatario() != null) {
            Cliente cliente = paquete.getClienteDestinatario();
            dto.setNombreClienteDestinatario(cliente.getNombreCompleto());
            dto.setTelefonoDestinatario(cliente.getTelefono());
            dto.setDireccionDestinatario(cliente.getDireccion());
            dto.setCantonDestinatario(cliente.getCanton());
            dto.setProvinciaDestinatario(cliente.getProvincia());
        }
        if (paquete.getAgenciaDestino() != null) {
            dto.setNombreAgenciaDestino(paquete.getAgenciaDestino().getNombre());
            dto.setCantonAgenciaDestino(paquete.getAgenciaDestino().getCanton());
        }
        if (paquete.getDestinatarioDirecto() != null) {
            dto.setNombreDestinatarioDirecto(paquete.getDestinatarioDirecto().getNombreDestinatario());
            dto.setDireccionDestinatarioDirecto(paquete.getDestinatarioDirecto().getDireccionDestinatario());
            dto.setCantonDestinatarioDirecto(paquete.getDestinatarioDirecto().getCanton());
        }
        return dto;
    }

    private String telefonoPrincipalAgencia(Agencia agencia) {
        if (agencia == null || agencia.getTelefonos() == null || agencia.getTelefonos().isEmpty()) {
            return null;
        }
        return agencia.getTelefonos().stream()
            .filter(telefono -> Boolean.TRUE.equals(telefono.getPrincipal()))
            .map(TelefonoAgencia::getNumero)
            .filter(numero -> numero != null && !numero.isBlank())
            .findFirst()
            .orElseGet(() -> agencia.getTelefonos().stream()
                .map(TelefonoAgencia::getNumero)
                .filter(numero -> numero != null && !numero.isBlank())
                .findFirst()
                .orElse(null));
    }

    private Usuario usuarioAutenticado() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
            return usuarioRepository.findByUsername(auth.getName()).orElse(null);
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

    public DespachoRapidoDTO quitarPaquete(Long idDespacho, Long idSaca, Long idPaquete) {
        Despacho despacho = cargarAccesible(idDespacho);
        assertEditable(despacho);

        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(idDespacho);
        Saca saca = sacas.stream()
            .filter(s -> s.getIdSaca().equals(idSaca))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("La saca no pertenece a este despacho"));

        Paquete paquete = paqueteRepository.findById(idPaquete)
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));

        if (saca.getPaqueteSacas() == null || saca.getPaqueteSacas().isEmpty()) {
            throw new BadRequestException("La saca no tiene paquetes asignados");
        }

        PaqueteSaca asociacion = saca.getPaqueteSacas().stream()
            .filter(ps -> ps.getPaquete().getIdPaquete().equals(idPaquete))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("El paquete no está en esta saca"));

        saca.getPaqueteSacas().remove(asociacion);
        paquete.getPaqueteSacas().remove(asociacion);
        paqueteRepository.saveAndFlush(paquete);
        sacaRepository.saveAndFlush(saca);

        despachoService.restaurarEstadoPaqueteSiProcede(paquete);
        paqueteRepository.saveAndFlush(paquete);

        marcarEnEnsacadoSiCapturaContinua(despacho);
        return toDTO(recargar(idDespacho));
    }

    public void eliminar(Long idDespacho) {
        Despacho despacho = cargarAccesible(idDespacho);
        if (despacho.getEstado() == EstadoDespacho.FINALIZADO) {
            throw new BadRequestException("No se puede eliminar un despacho finalizado");
        }

        List<Saca> sacas = sacaRepository.findByDespachoIdDespacho(idDespacho);
        for (Saca s : sacas) {
            if (s.getPaqueteSacas() != null) {
                List<PaqueteSaca> asociaciones = new ArrayList<>(s.getPaqueteSacas());
                for (PaqueteSaca ps : asociaciones) {
                    Paquete paquete = ps.getPaquete();
                    paquete.getPaqueteSacas().remove(ps);
                    despachoService.restaurarEstadoPaqueteSiProcede(paquete);
                    paqueteRepository.save(paquete);
                }
                s.getPaqueteSacas().clear();
                sacaRepository.save(s);
            }
        }
        despachoRepository.delete(despacho);
    }
}
