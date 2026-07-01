package com.candas.candas_backend.service;

import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.Despacho;
import com.candas.candas_backend.entity.LoteRecepcion;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.TipoLote;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.AgenciaRepository;
import com.candas.candas_backend.repository.LoteRecepcionRepository;
import com.candas.candas_backend.repository.PaqueteRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Asegura que los paquetes asociados a un despacho/saca tengan un lote de recepción,
 * creando (o reutilizando) un lote {@link TipoLote#AUTOMATICO_DESPACHO} agrupado por
 * fecha de despacho + agencia propietaria del despacho cuando el paquete no tiene lote.
 *
 * No reutiliza {@link LoteRecepcionService#agregarPaquetes} porque ese método fuerza
 * estado {@code RECIBIDO} en el paquete; un paquete que llega por esta vía puede ya estar
 * {@code ASIGNADO_SACA}, {@code ENSACADO} o {@code DESPACHADO}, y forzar su estado rompería
 * el flujo de despachos rápidos. Este servicio solo asigna la relación con el lote.
 */
@Service
@Transactional
public class LoteRecepcionAutomaticoService {

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String PREFIJO_NUMERO_RECEPCION_AUTOMATICO = "REC-AUTO-";

    private final LoteRecepcionRepository loteRecepcionRepository;
    private final AgenciaRepository agenciaRepository;
    private final PaqueteRepository paqueteRepository;
    private final LoteRecepcionAutomaticoService self;

    public LoteRecepcionAutomaticoService(
            LoteRecepcionRepository loteRecepcionRepository,
            AgenciaRepository agenciaRepository,
            PaqueteRepository paqueteRepository,
            @Lazy LoteRecepcionAutomaticoService self) {
        this.loteRecepcionRepository = loteRecepcionRepository;
        this.agenciaRepository = agenciaRepository;
        this.paqueteRepository = paqueteRepository;
        this.self = self;
    }

    /**
     * Asegura el lote automático del paquete para el despacho dado: si el paquete ya tiene
     * lote de recepción, no hace nada. Si no tiene, busca o crea el lote automático de la
     * agencia propietaria del despacho para la fecha del despacho, y lo asocia al paquete
     * sin modificar su estado ni su fechaRecepcion.
     *
     * Si el despacho no tiene agencia propietaria (caso válido: administrador sin agencia
     * origen activa seleccionada, ver {@code AgenciaScopeResolver.requireAgenciaOrigenActivaParaCreacion}),
     * no hace nada: no hay una agencia inequívoca para agrupar el lote, y el paquete simplemente
     * queda sin lote automático (mismo comportamiento que antes de esta integración).
     */
    public void asegurarLoteParaPaqueteEnDespacho(Paquete paquete, Despacho despacho) {
        if (paquete == null || despacho == null) {
            return;
        }
        if (paquete.getLoteRecepcion() != null) {
            return;
        }
        Agencia agenciaDespacho = despacho.getAgenciaPropietaria();
        if (agenciaDespacho == null) {
            return;
        }
        LocalDate fecha = despacho.getFechaDespacho() != null
                ? despacho.getFechaDespacho().toLocalDate()
                : LocalDate.now();

        LoteRecepcion lote = asegurarLoteAutomatico(agenciaDespacho.getIdAgencia(), fecha);
        paquete.setLoteRecepcion(lote);
        paqueteRepository.save(paquete);
    }

    /** Busca el lote automático de la agencia/fecha, o lo crea si no existe (a prueba de carreras concurrentes). */
    public LoteRecepcion asegurarLoteAutomatico(Long idAgencia, LocalDate fecha) {
        return buscarLoteAutomatico(idAgencia, fecha)
                .orElseGet(() -> crearLoteAutomaticoSeguro(idAgencia, fecha));
    }

    public Optional<LoteRecepcion> buscarLoteAutomatico(Long idAgencia, LocalDate fecha) {
        return loteRecepcionRepository.findByNumeroRecepcion(construirNumeroRecepcionAutomatico(idAgencia, fecha));
    }

    /**
     * La creación corre en una transacción nueva (propia conexión) para que, si otro
     * dispositivo/hilo ya creó el lote en paralelo y el INSERT viola la unicidad de
     * numeroRecepcion, solo esa transacción interna se aborte. Postgres marca abortada
     * toda la transacción tras un error; sin REQUIRES_NEW, la búsqueda de reintento
     * fallaría en la misma transacción ya abortada. Requiere auto-inyección (`self`)
     * porque las anotaciones @Transactional no aplican en llamadas internas (this.metodo()).
     */
    private LoteRecepcion crearLoteAutomaticoSeguro(Long idAgencia, LocalDate fecha) {
        try {
            return self.crearLoteAutomaticoNuevaTransaccion(idAgencia, fecha);
        } catch (DataIntegrityViolationException concurrente) {
            return buscarLoteAutomatico(idAgencia, fecha).orElseThrow(() -> concurrente);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LoteRecepcion crearLoteAutomaticoNuevaTransaccion(Long idAgencia, LocalDate fecha) {
        Agencia agencia = agenciaRepository.findById(idAgencia)
                .orElseThrow(() -> new ResourceNotFoundException("Agencia", idAgencia));

        LoteRecepcion lote = new LoteRecepcion();
        lote.setTipoLote(TipoLote.AUTOMATICO_DESPACHO);
        lote.setNumeroRecepcion(construirNumeroRecepcionAutomatico(idAgencia, fecha));
        lote.setAgencia(agencia);
        lote.setFechaRecepcion(fecha.atStartOfDay());
        return loteRecepcionRepository.save(lote);
    }

    /** Determinístico por (agencia, fecha): garantiza un único lote automático por día/agencia vía la unicidad de numeroRecepcion. */
    private static String construirNumeroRecepcionAutomatico(Long idAgencia, LocalDate fecha) {
        return PREFIJO_NUMERO_RECEPCION_AUTOMATICO + idAgencia + "-" + fecha.format(FORMATO_FECHA);
    }
}
