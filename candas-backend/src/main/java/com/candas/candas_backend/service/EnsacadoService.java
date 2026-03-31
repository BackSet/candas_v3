package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.*;
import com.candas.candas_backend.entity.*;
import com.candas.candas_backend.entity.enums.EstadoPaquete;
import com.candas.candas_backend.entity.enums.TamanoSaca;
import com.candas.candas_backend.exception.AgenciaAccessDeniedException;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import com.candas.candas_backend.security.AgenciaScopeResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class EnsacadoService {

    private final PaqueteRepository paqueteRepository;
    private final DespachoRepository despachoRepository;
    private final SacaRepository sacaRepository;
    private final AgenciaRepository agenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EnsacadoSesionRepository ensacadoSesionRepository;
    private final AgenciaScopeResolver agenciaScopeResolver;
    private final DespachoService despachoService;

    public EnsacadoService(
            PaqueteRepository paqueteRepository,
            DespachoRepository despachoRepository,
            SacaRepository sacaRepository,
            AgenciaRepository agenciaRepository,
            UsuarioRepository usuarioRepository,
            EnsacadoSesionRepository ensacadoSesionRepository,
            AgenciaScopeResolver agenciaScopeResolver,
            DespachoService despachoService) {
        this.paqueteRepository = paqueteRepository;
        this.despachoRepository = despachoRepository;
        this.sacaRepository = sacaRepository;
        this.agenciaRepository = agenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.ensacadoSesionRepository = ensacadoSesionRepository;
        this.agenciaScopeResolver = agenciaScopeResolver;
        this.despachoService = despachoService;
    }

    // Capacidades máximas por tamaño de saca (en kg)
    private static final Map<TamanoSaca, BigDecimal> CAPACIDADES = Map.of(
        TamanoSaca.INDIVIDUAL, new BigDecimal("5.0"),
        TamanoSaca.PEQUENO, new BigDecimal("15.0"),
        TamanoSaca.MEDIANO, new BigDecimal("30.0"),
        TamanoSaca.GRANDE, new BigDecimal("50.0")
    );

    /**
     * Busca un paquete por número de guía y retorna información completa para ensacado
     */
    public PaqueteEnsacadoInfoDTO buscarPaqueteParaEnsacar(String numeroGuia) {
        Paquete paquete = paqueteRepository.findByNumeroGuiaIgnoreCase(numeroGuia)
            .orElseThrow(() -> new ResourceNotFoundException("Paquete con número de guía: " + numeroGuia));

        assertPaqueteAccesibleEnsacado(paquete);
        
        // Verificar si el paquete está en una saca
        PaqueteSaca ps = null;
        if (paquete.getPaqueteSacas() != null && !paquete.getPaqueteSacas().isEmpty()) {
            ps = paquete.getPaqueteSacas().stream()
                .filter(p -> p.getSaca().getDespacho() != null)
                .max(Comparator.comparing(p -> p.getSaca().getFechaCreacion()))
                .orElse(paquete.getPaqueteSacas().get(0));
        }
        boolean enSaca = ps != null && ps.getSaca() != null && ps.getSaca().getDespacho() != null;

        // Si no está en saca, retornar información básica del paquete
        if (!enSaca) {
            PaqueteEnsacadoInfoDTO info = new PaqueteEnsacadoInfoDTO();
            info.setIdPaquete(paquete.getIdPaquete());
            info.setNumeroGuia(paquete.getNumeroGuia());
            info.setEnSaca(false);
            
            // Obtener dirección del destinatario
            if (paquete.getClienteDestinatario() != null) {
                info.setDireccionDestinatarioCompleta(construirDireccionCompleta(
                    paquete.getClienteDestinatario().getDireccion(),
                    paquete.getClienteDestinatario().getCanton(),
                    paquete.getClienteDestinatario().getProvincia(),
                    paquete.getClienteDestinatario().getPais()
                ));
            }
            
            // Obtener observaciones
            info.setObservaciones(paquete.getObservaciones());
            
            // Establecer mensaje de alerta
            info.setMensajeAlerta("El paquete no está asignado a ninguna saca. Estado actual: " + 
                (paquete.getEstado() != null ? paquete.getEstado().toString() : "null"));
            
            return info;
        }

        // En este punto enSaca es true, por tanto ps y saca no son null; comprobación explícita para el analizador
        if (ps == null) {
            throw new IllegalStateException("PaqueteSaca no puede ser null cuando el paquete está en saca");
        }
        Saca sacaAsignada = ps.getSaca();
        Despacho despacho = sacaAsignada.getDespacho();

        // Si el paquete está en una saca, permitir ver la información independientemente del estado
        // Solo se podrá marcar como ensacado si el estado es ASIGNADO_SACA (esto se valida en marcarPaqueteComoEnsacado)
        // No lanzar excepción aquí, simplemente continuar con el flujo normal
        
        // Calcular información de la saca asignada
        if (sacaAsignada.getTamano() == null) {
            throw new IllegalArgumentException("La saca asignada no tiene tamaño definido");
        }
        BigDecimal capacidadMaxima = CAPACIDADES.get(sacaAsignada.getTamano());
        // Siempre recalcular el peso actual sumando los paquetes ensacados para asegurar precisión
        // Esto evita problemas de sincronización con el peso total almacenado
        BigDecimal pesoActual = calcularPesoActualSaca(sacaAsignada);
        BigDecimal porcentajeLlenadoSaca = calcularPorcentaje(pesoActual, capacidadMaxima);
        int paquetesEnSaca = contarPaquetesEnSaca(sacaAsignada);
        int paquetesFaltantesSaca = contarPaquetesPendientesSaca(sacaAsignada);
        
        // Obtener destino del paquete
        String destino = obtenerDestinoPaquete(paquete);
        
        // Calcular información del despacho completo
        DespachoEnsacadoInfoDTO infoDespacho = calcularInfoDespacho(despacho);
        
        // Construir respuesta
        PaqueteEnsacadoInfoDTO info = new PaqueteEnsacadoInfoDTO();
        info.setIdPaquete(paquete.getIdPaquete());
        info.setNumeroGuia(paquete.getNumeroGuia());
        info.setEnSaca(true);
        info.setIdSacaAsignada(sacaAsignada.getIdSaca());
        info.setCodigoQrSaca(sacaAsignada.getCodigoQr());
        info.setNumeroOrdenSaca(sacaAsignada.getNumeroOrden());
        info.setTamanoSaca(sacaAsignada.getTamano());
        info.setDestino(destino);
        info.setPorcentajeLlenadoSaca(porcentajeLlenadoSaca);
        info.setPaquetesEnSaca(paquetesEnSaca);
        info.setPaquetesFaltantesSaca(paquetesFaltantesSaca);
        info.setPesoActualSaca(pesoActual);
        info.setCapacidadMaximaSaca(capacidadMaxima);
        info.setIdDespacho(despacho.getIdDespacho());
        info.setNumeroManifiesto(despacho.getNumeroManifiesto());
        info.setFechaDespacho(despacho.getFechaDespacho());
        info.setTotalSacas(infoDespacho.getSacas() != null ? infoDespacho.getSacas().size() : 0);
        info.setPorcentajeLlenadoDespacho(infoDespacho.getPorcentajeCompletado());
        info.setPaquetesEnDespacho(infoDespacho.getPaquetesEnsacados());
        info.setPaquetesFaltantesDespacho(infoDespacho.getPaquetesPendientes());
        info.setDespachoLleno(infoDespacho.getCompletado());
        // La saca solo está llena si el porcentaje es >= 100% Y no hay paquetes pendientes
        // Si hay paquetes pendientes, la saca no está llena porque aún se pueden ensacar
        boolean sacaLlena = porcentajeLlenadoSaca.compareTo(BigDecimal.valueOf(100)) >= 0 && paquetesFaltantesSaca == 0;
        info.setSacaLlena(sacaLlena);
        // El paquete ya está ensacado si está en estado ENSACADO o DESPACHADO
        info.setYaEnsacado(paquete.getEstado() == EstadoPaquete.ENSACADO || paquete.getEstado() == EstadoPaquete.DESPACHADO);
        
        // Obtener dirección del destinatario del paquete
        if (paquete.getClienteDestinatario() != null) {
            info.setDireccionDestinatarioCompleta(construirDireccionCompleta(
                paquete.getClienteDestinatario().getDireccion(),
                paquete.getClienteDestinatario().getCanton(),
                paquete.getClienteDestinatario().getProvincia(),
                paquete.getClienteDestinatario().getPais()
            ));
        }
        
        // Obtener observaciones del paquete
        info.setObservaciones(paquete.getObservaciones());
        
        // Agregar información de agencia o destinatario directo del despacho
        if (despacho.getAgencia() != null) {
            info.setIdAgencia(despacho.getAgencia().getIdAgencia());
            info.setNombreAgencia(despacho.getAgencia().getNombre());
            info.setDireccionAgencia(despacho.getAgencia().getDireccion());
            info.setCantonAgencia(despacho.getAgencia().getCanton());
            // Obtener teléfono principal de la agencia si existe
            if (despacho.getAgencia().getTelefonos() != null && !despacho.getAgencia().getTelefonos().isEmpty()) {
                String telefono = despacho.getAgencia().getTelefonos().stream()
                    .filter(t -> t.getPrincipal() != null && t.getPrincipal())
                    .findFirst()
                    .map(t -> t.getNumero())
                    .orElse(despacho.getAgencia().getTelefonos().get(0).getNumero());
                info.setTelefonoAgencia(telefono);
            }
        } else if (despacho.getDestinatarioDirecto() != null) {
            DestinatarioDirecto destinatario = despacho.getDestinatarioDirecto();
            info.setIdDestinatarioDirecto(destinatario.getIdDestinatarioDirecto());
            info.setNombreDestinatarioDirecto(destinatario.getNombreDestinatario());
            info.setTelefonoDestinatarioDirecto(destinatario.getTelefonoDestinatario());
            info.setDireccionDestinatarioDirecto(destinatario.getDireccionDestinatario());
        }
        
        // Generar mensajes de alerta
        String mensajeAlerta = generarMensajeAlerta(info);
        if (info.getYaEnsacado()) {
            String estadoMensaje = paquete.getEstado() == EstadoPaquete.DESPACHADO 
                ? "El paquete ya fue despachado" 
                : "El paquete ya está ensacado físicamente";
            if (mensajeAlerta != null && !mensajeAlerta.isEmpty()) {
                mensajeAlerta = estadoMensaje + ". " + mensajeAlerta;
            } else {
                mensajeAlerta = estadoMensaje;
            }
        } else if (paquete.getEstado() != EstadoPaquete.ASIGNADO_SACA) {
            // Si el paquete no está en estado ASIGNADO_SACA, agregar mensaje informativo
            if (mensajeAlerta != null && !mensajeAlerta.isEmpty()) {
                mensajeAlerta = "Estado del paquete: " + paquete.getEstado().toString() + ". " + mensajeAlerta;
            } else {
                mensajeAlerta = "Estado del paquete: " + paquete.getEstado().toString() + ". Solo se pueden ensacar paquetes en estado ASIGNADO_SACA.";
            }
        }
        info.setMensajeAlerta(mensajeAlerta);

        return info;
    }

    /**
     * Marca un paquete como ensacado
     */
    public void marcarPaqueteComoEnsacado(Long idPaquete) {
        Paquete paquete = paqueteRepository.findById(idPaquete)
            .orElseThrow(() -> new ResourceNotFoundException("Paquete", idPaquete));

        assertPaqueteAccesibleEnsacado(paquete);
        
        if (paquete.getEstado() == EstadoPaquete.ENSACADO) {
            throw new IllegalArgumentException("El paquete ya está ensacado físicamente");
        }
        
        if (paquete.getEstado() != EstadoPaquete.ASIGNADO_SACA) {
            throw new IllegalArgumentException("El paquete debe estar asignado a una saca (ASIGNADO_SACA) para poder ensacarse. Estado actual: " + 
                (paquete.getEstado() != null ? paquete.getEstado().toString() : "null"));
        }
        
        if (paquete.getPaqueteSacas() == null || paquete.getPaqueteSacas().isEmpty()) {
            throw new IllegalArgumentException("El paquete no está asociado a ninguna saca");
        }
        
        paquete.setEstado(EstadoPaquete.ENSACADO);
        paquete.setFechaEnsacado(LocalDateTime.now());
        paqueteRepository.save(paquete);
        
        // Actualizar peso total de la saca(s)
        for (PaqueteSaca ps : paquete.getPaqueteSacas()) {
            Saca saca = ps.getSaca();
            BigDecimal nuevoPeso = calcularPesoActualSaca(saca);
            saca.setPesoTotal(nuevoPeso);
            if (saca.getFechaEnsacado() == null) {
                saca.setFechaEnsacado(LocalDateTime.now());
            }
            sacaRepository.save(saca);
        }

        // Actualizar sesión de ensacado para vista móvil
        obtenerUsuarioActual().ifPresent(usuario -> actualizarSesionConPaquete(usuario, idPaquete));
    }

    /**
     * Obtiene la sesión activa de ensacado del usuario (para vista móvil en tiempo real).
     */
    public EnsacadoSessionResponseDTO getSesionActiva(String username) {
        if (username == null || username.isBlank()) {
            return new EnsacadoSessionResponseDTO(null, null);
        }
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        if (usuario == null) {
            return new EnsacadoSessionResponseDTO(null, null);
        }
        Optional<EnsacadoSesion> opt = ensacadoSesionRepository.findByUsuarioIdUsuarioWithPaquete(usuario.getIdUsuario());
        if (opt.isEmpty() || opt.get().getPaquete() == null) {
            return new EnsacadoSessionResponseDTO(null, null);
        }
        EnsacadoSesion sesion = opt.get();
        String numeroGuia = sesion.getPaquete().getNumeroGuia();
        if (numeroGuia == null || numeroGuia.isBlank()) {
            return new EnsacadoSessionResponseDTO(null, null);
        }
        try {
            PaqueteEnsacadoInfoDTO info = buscarPaqueteParaEnsacar(numeroGuia);
            String lastUpdated = sesion.getUpdatedAt().format(DateTimeFormatter.ISO_DATE_TIME);
            return new EnsacadoSessionResponseDTO(info, lastUpdated);
        } catch (Exception e) {
            return new EnsacadoSessionResponseDTO(null, sesion.getUpdatedAt().format(DateTimeFormatter.ISO_DATE_TIME));
        }
    }

    /**
     * Actualiza la sesión con la última búsqueda (número de guía) para que la vista móvil la muestre.
     */
    public void actualizarUltimaBusqueda(String username, String numeroGuia) {
        if (username == null || username.isBlank() || numeroGuia == null || numeroGuia.isBlank()) {
            return;
        }
        try {
            PaqueteEnsacadoInfoDTO info = buscarPaqueteParaEnsacar(numeroGuia.trim());
            Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
            if (usuario != null && usuario.getIdUsuario() != null && info.getIdPaquete() != null) {
                actualizarSesionConPaquete(usuario, info.getIdPaquete());
            }
        } catch (ResourceNotFoundException e) {
            // Paquete no encontrado: no actualizar sesión
        }
    }

    private Optional<Usuario> obtenerUsuarioActual() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                String username = auth.getName();
                if (username != null && !username.isBlank()) {
                    return usuarioRepository.findByUsername(username);
                }
            }
        } catch (Exception ignored) {
        }
        return Optional.empty();
    }

    private void actualizarSesionConPaquete(Usuario usuario, Long idPaquete) {
        if (usuario == null || usuario.getIdUsuario() == null) {
            return;
        }
        Paquete paquete = paqueteRepository.findById(idPaquete).orElse(null);
        if (paquete == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        Long idUsuario = usuario.getIdUsuario();
        // Upsert nativo evita persist de EnsacadoSesion y el error "null identifier" con @MapsId
        ensacadoSesionRepository.upsertSesion(idUsuario, idPaquete, now);
    }

    /**
     * Obtiene lista de despachos con paquetes pendientes de ensacar en el periodo indicado.
     * Si ambas fechas son null, se usan por defecto los últimos 7 días.
     */
    public List<DespachoEnsacadoInfoDTO> obtenerDespachosEnProgreso(LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio;
        LocalDateTime fin;
        if (fechaInicio == null && fechaFin == null) {
            inicio = LocalDateTime.now().minusDays(7).toLocalDate().atStartOfDay();
            fin = LocalDateTime.now();
        } else {
            LocalDate inicioDate = fechaInicio != null ? fechaInicio : LocalDate.now().minusDays(7);
            LocalDate finDate = fechaFin != null ? fechaFin : LocalDate.now();
            if (inicioDate.isAfter(finDate)) {
                throw new IllegalArgumentException("fechaInicio no puede ser posterior a fechaFin");
            }
            inicio = inicioDate.atStartOfDay();
            fin = finDate.atTime(LocalTime.MAX);
        }
        List<Despacho> despachos = despachoRepository.findDespachosConPaquetesPendientesEntre(inicio, fin);
        return despachos.stream()
            .filter(despachoService::isDespachoAccesiblePorAlcance)
            .map(this::calcularInfoDespacho)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene lista de despachos completamente ensacados
     */
    public List<DespachoEnsacadoInfoDTO> obtenerDespachosCompletados() {
        // Filtrar despachos de los últimos 7 días
        LocalDateTime fechaInicio = LocalDateTime.now().minusDays(7);
        List<Despacho> despachos = despachoRepository.findDespachosCompletamenteEnsacados(fechaInicio);
        return despachos.stream()
            .filter(despachoService::isDespachoAccesiblePorAlcance)
            .map(this::calcularInfoDespacho)
            .sorted(Comparator
                .comparing((DespachoEnsacadoInfoDTO d) -> d.getFechaUltimoEnsacado() != null ? d.getFechaUltimoEnsacado() : d.getFechaDespacho(), Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(DespachoEnsacadoInfoDTO::getFechaDespacho, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());
    }

    /**
     * Obtiene información detallada de un despacho para ensacado
     */
    public DespachoEnsacadoInfoDTO obtenerInfoDespacho(Long idDespacho) {
        despachoService.ensureDespachoAccesible(idDespacho);
        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        return calcularInfoDespacho(despacho);
    }

    /**
     * Obtiene sacas en progreso de un despacho
     */
    public List<SacaEnsacadoInfoDTO> obtenerSacasEnProgreso(Long idDespacho) {
        despachoService.ensureDespachoAccesible(idDespacho);
        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        
        return despacho.getSacas().stream()
            .filter(saca -> !esSacaCompletada(saca))
            .map(this::calcularInfoSaca)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene sacas completadas de un despacho
     */
    public List<SacaEnsacadoInfoDTO> obtenerSacasCompletadas(Long idDespacho) {
        despachoService.ensureDespachoAccesible(idDespacho);
        Despacho despacho = despachoRepository.findById(idDespacho)
            .orElseThrow(() -> new ResourceNotFoundException("Despacho", idDespacho));
        
        return despacho.getSacas().stream()
            .filter(this::esSacaCompletada)
            .map(this::calcularInfoSaca)
            .collect(Collectors.toList());
    }

    // Métodos auxiliares privados

    /**
     * Alcance ensacado: si hay restricción por agencia, el paquete debe estar ligado a un despacho visible
     * (registrador en la agencia) o, sin despacho en saca, a agencia destino o lote de recepción de esa agencia.
     */
    private void assertPaqueteAccesibleEnsacado(Paquete paquete) {
        var idAgOpt = agenciaScopeResolver.idAgenciaRestringida();
        if (idAgOpt.isEmpty()) {
            return;
        }
        Long idAgencia = idAgOpt.get();
        Despacho despachoEnSaca = null;
        if (paquete.getPaqueteSacas() != null) {
            for (PaqueteSaca ps : paquete.getPaqueteSacas()) {
                if (ps.getSaca() != null && ps.getSaca().getDespacho() != null) {
                    despachoEnSaca = ps.getSaca().getDespacho();
                    break;
                }
            }
        }
        if (despachoEnSaca != null) {
            if (!despachoService.isDespachoAccesiblePorAlcance(despachoEnSaca)) {
                throw new AgenciaAccessDeniedException(construirMensajeAccesoEnsacado(idAgencia, paquete, despachoEnSaca));
            }
            return;
        }
        if (paquete.getAgenciaDestino() != null && idAgencia.equals(paquete.getAgenciaDestino().getIdAgencia())) {
            return;
        }
        if (paquete.getLoteRecepcion() != null && paquete.getLoteRecepcion().getAgencia() != null
                && idAgencia.equals(paquete.getLoteRecepcion().getAgencia().getIdAgencia())) {
            return;
        }
        throw new AgenciaAccessDeniedException(construirMensajeAccesoEnsacado(idAgencia, paquete, null));
    }

    private String construirMensajeAccesoEnsacado(Long idAgenciaUsuario, Paquete paquete, Despacho despachoEnSaca) {
        String agenciaUsuario = agenciaRepository.findById(idAgenciaUsuario)
                .map(this::descripcionAgencia)
                .orElse("agencia con id " + idAgenciaUsuario);
        String agenciaRecurso = "agencia no identificada";
        if (despachoEnSaca != null) {
            agenciaRecurso = Optional.ofNullable(despachoEnSaca.getUsuarioRegistro())
                    .map(Usuario::getAgencia)
                    .map(this::descripcionAgencia)
                    .orElse("agencia no identificada");
        } else if (paquete.getAgenciaDestino() != null) {
            agenciaRecurso = descripcionAgencia(paquete.getAgenciaDestino());
        } else if (paquete.getLoteRecepcion() != null && paquete.getLoteRecepcion().getAgencia() != null) {
            agenciaRecurso = descripcionAgencia(paquete.getLoteRecepcion().getAgencia());
        }
        return "Tu usuario pertenece a la " + agenciaUsuario
                + ". El recurso que intentas operar en ensacado pertenece a " + agenciaRecurso
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

    private LocalDateTime obtenerFechaUltimoEnsacadoDespacho(Despacho despacho) {
        List<Paquete> todosPaquetes = paqueteRepository.findBySacaDespachoIdDespacho(despacho.getIdDespacho());
        return todosPaquetes.stream()
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO && p.getFechaEnsacado() != null)
            .map(Paquete::getFechaEnsacado)
            .max(LocalDateTime::compareTo)
            .orElse(null);
    }

    private DespachoEnsacadoInfoDTO calcularInfoDespacho(Despacho despacho) {
        DespachoEnsacadoInfoDTO info = new DespachoEnsacadoInfoDTO();
        info.setIdDespacho(despacho.getIdDespacho());
        info.setNumeroManifiesto(despacho.getNumeroManifiesto());
        info.setFechaDespacho(despacho.getFechaDespacho());
        
        // Obtener todos los paquetes del despacho
        List<Paquete> todosPaquetes = paqueteRepository.findBySacaDespachoIdDespacho(despacho.getIdDespacho());
        int totalPaquetes = todosPaquetes.size();
        int paquetesEnsacados = (int) todosPaquetes.stream()
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO)
            .count();
        int paquetesPendientes = totalPaquetes - paquetesEnsacados;
        
        info.setTotalPaquetes(totalPaquetes);
        info.setPaquetesEnsacados(paquetesEnsacados);
        info.setPaquetesPendientes(paquetesPendientes);
        info.setCompletado(paquetesPendientes == 0 && totalPaquetes > 0);
        
        // Calcular porcentaje
        if (totalPaquetes > 0) {
            BigDecimal porcentaje = BigDecimal.valueOf(paquetesEnsacados)
                .divide(BigDecimal.valueOf(totalPaquetes), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
            info.setPorcentajeCompletado(porcentaje);
        } else {
            info.setPorcentajeCompletado(BigDecimal.ZERO);
        }
        
        // Obtener destino del despacho
        info.setDestino(obtenerDestinoDespacho(despacho));
        
        // Obtener fecha del último paquete ensacado
        LocalDateTime fechaUltimoEnsacado = obtenerFechaUltimoEnsacadoDespacho(despacho);
        info.setFechaUltimoEnsacado(fechaUltimoEnsacado);
        
        // Calcular información de todas las sacas
        List<SacaEnsacadoInfoDTO> sacasInfo = despacho.getSacas().stream()
            .map(this::calcularInfoSaca)
            .sorted(Comparator.comparing(SacaEnsacadoInfoDTO::getNumeroOrden))
            .collect(Collectors.toList());
        info.setSacas(sacasInfo);
        
        return info;
    }

    private SacaEnsacadoInfoDTO calcularInfoSaca(Saca saca) {
        SacaEnsacadoInfoDTO info = new SacaEnsacadoInfoDTO();
        info.setIdSaca(saca.getIdSaca());
        info.setCodigoQr(saca.getCodigoQr());
        info.setNumeroOrden(saca.getNumeroOrden());
        info.setTamano(saca.getTamano());
        
        BigDecimal capacidadMaxima = CAPACIDADES.get(saca.getTamano());
        BigDecimal pesoActual = calcularPesoActualSaca(saca);
        int paquetesActuales = contarPaquetesEnSaca(saca);
        int paquetesEsperados = contarPaquetesAsignadosSaca(saca);
        
        info.setPesoActual(pesoActual);
        info.setCapacidadMaxima(capacidadMaxima);
        info.setPaquetesActuales(paquetesActuales);
        info.setPaquetesEsperados(paquetesEsperados);
        info.setPorcentajeLlenado(calcularPorcentaje(pesoActual, capacidadMaxima));
        info.setCompletada(esSacaCompletada(saca));
        
        // Obtener destino común de los paquetes
        info.setDestino(obtenerDestinoSaca(saca));
        
        // Obtener lista de paquetes pendientes (asignados pero no ensacados físicamente)
        List<String> paquetesPendientes = saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() == EstadoPaquete.ASIGNADO_SACA)
            .map(Paquete::getNumeroGuia)
            .collect(Collectors.toList());
        info.setPaquetesPendientes(paquetesPendientes);

        // Obtener lista de guías ya ensacadas en esta saca
        List<String> paquetesEnsacados = saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO)
            .map(Paquete::getNumeroGuia)
            .collect(Collectors.toList());
        info.setPaquetesEnsacados(paquetesEnsacados);

        return info;
    }

    private BigDecimal calcularPesoActualSaca(Saca saca) {
        return saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO)
            .map(p -> p.getPesoKilos() != null ? p.getPesoKilos() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularPorcentaje(BigDecimal actual, BigDecimal maximo) {
        if (maximo == null || maximo.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal porcentaje = actual.divide(maximo, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(2, RoundingMode.HALF_UP);
        // Limitar el porcentaje a 100% máximo
        if (porcentaje.compareTo(BigDecimal.valueOf(100)) > 0) {
            return BigDecimal.valueOf(100);
        }
        return porcentaje;
    }

    private int contarPaquetesEnSaca(Saca saca) {
        return (int) saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() == EstadoPaquete.ENSACADO)
            .count();
    }

    private int contarPaquetesAsignadosSaca(Saca saca) {
        return saca.getPaqueteSacas().size();
    }

    private int contarPaquetesPendientesSaca(Saca saca) {
        return (int) saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .filter(p -> p.getEstado() != EstadoPaquete.ENSACADO)
            .count();
    }

    private boolean esSacaCompletada(Saca saca) {
        return saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .allMatch(p -> p.getEstado() == EstadoPaquete.ENSACADO);
    }

    private String obtenerDestinoPaquete(Paquete paquete) {
        if (paquete.getAgenciaDestino() != null) {
            return paquete.getAgenciaDestino().getNombre();
        }
        if (paquete.getClienteDestinatario() != null) {
            String direccionCompleta = construirDireccionCompleta(
                paquete.getClienteDestinatario().getDireccion(),
                paquete.getClienteDestinatario().getCanton(),
                paquete.getClienteDestinatario().getProvincia(),
                paquete.getClienteDestinatario().getPais()
            );
            if (direccionCompleta != null && !direccionCompleta.trim().isEmpty()) {
                return direccionCompleta;
            }
            return paquete.getClienteDestinatario().getNombreCompleto();
        }
        return "Destino no especificado";
    }

    private String obtenerDestinoSaca(Saca saca) {
        // Obtener el destino más común de los paquetes en la saca
        Map<String, Long> destinos = saca.getPaqueteSacas().stream()
            .map(PaqueteSaca::getPaquete)
            .map(this::obtenerDestinoPaquete)
            .collect(Collectors.groupingBy(d -> d, Collectors.counting()));
        
        return destinos.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("Destino no especificado");
    }

    private String obtenerDestinoDespacho(Despacho despacho) {
        if (despacho.getAgencia() != null) {
            return despacho.getAgencia().getNombre();
        }
        if (despacho.getDistribuidor() != null) {
            return despacho.getDistribuidor().getNombre();
        }
        if (despacho.getDestinatarioDirecto() != null) {
            return despacho.getDestinatarioDirecto().getNombreDestinatario();
        }
        return "Destino no especificado";
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

    private String generarMensajeAlerta(PaqueteEnsacadoInfoDTO info) {
        List<String> mensajes = new ArrayList<>();
        
        if (info.getSacaLlena()) {
            mensajes.add("Saca llena");
        } else if (info.getPorcentajeLlenadoSaca().compareTo(BigDecimal.valueOf(80)) >= 0) {
            mensajes.add("Saca casi llena (" + info.getPorcentajeLlenadoSaca() + "%)");
        }
        
        if (info.getDespachoLleno()) {
            mensajes.add("Despacho completo");
        }
        
        if (info.getPaquetesFaltantesSaca() == 0) {
            mensajes.add("Todos los paquetes de la saca están ensacados");
        }
        
        return mensajes.isEmpty() ? null : String.join("; ", mensajes);
    }
}
