package com.candas.candas_backend.mapper;

import com.candas.candas_backend.dto.PaqueteDTO;
import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.PaqueteSaca;
import com.candas.candas_backend.entity.PaqueteSacaId;
import com.candas.candas_backend.entity.Saca;
import com.candas.candas_backend.entity.enums.TipoDestino;
import com.candas.candas_backend.exception.ResourceNotFoundException;
import com.candas.candas_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class PaqueteMapper {

    @Autowired
    private PaqueteRepository paqueteRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PuntoOrigenRepository puntoOrigenRepository;

    @Autowired
    private AgenciaRepository agenciaRepository;

    @Autowired
    private DestinatarioDirectoRepository destinatarioDirectoRepository;

    @Autowired
    private LoteRecepcionRepository loteRecepcionRepository;

    @Autowired
    private SacaRepository sacaRepository;

    public Paquete toEntity(PaqueteDTO dto) {
        Paquete paquete = new Paquete();
        paquete.setNumeroGuia(dto.getNumeroGuia());
        paquete.setNumeroMaster(dto.getNumeroMaster());
        paquete.setPesoKilos(dto.getPesoKilos());
        paquete.setPesoLibras(dto.getPesoLibras());
        paquete.setEstado(dto.getEstado());
        paquete.setTipoPaquete(dto.getTipoPaquete());
        paquete.setEtiquetaDestinatario(dto.getEtiquetaDestinatario());
        paquete.setObservaciones(dto.getObservaciones());
        paquete.setSed(dto.getSed());
        paquete.setMedidas(dto.getMedidas());
        paquete.setDescripcion(dto.getDescripcion());
        paquete.setValor(dto.getValor());
        paquete.setTarifaPosition(dto.getTarifaPosition());
        paquete.setRef(dto.getRef());

        if (dto.getIdPuntoOrigen() != null) {
            paquete.setPuntoOrigen(puntoOrigenRepository.findById(dto.getIdPuntoOrigen())
                    .orElseThrow(() -> new ResourceNotFoundException("PuntoOrigen", dto.getIdPuntoOrigen())));
        }

        paquete.setClienteRemitente(clienteRepository.findById(dto.getIdClienteRemitente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdClienteRemitente())));

        if (dto.getIdClienteDestinatario() != null) {
            paquete.setClienteDestinatario(clienteRepository.findById(dto.getIdClienteDestinatario())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdClienteDestinatario())));
        }

        if (dto.getIdAgenciaDestino() != null) {
            paquete.setAgenciaDestino(agenciaRepository.findById(dto.getIdAgenciaDestino())
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgenciaDestino())));
        }

        if (dto.getIdDestinatarioDirecto() != null) {
            paquete.setDestinatarioDirecto(destinatarioDirectoRepository.findById(dto.getIdDestinatarioDirecto())
                    .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto",
                            dto.getIdDestinatarioDirecto())));
        }

        if (dto.getIdLoteRecepcion() != null) {
            paquete.setLoteRecepcion(loteRecepcionRepository.findById(dto.getIdLoteRecepcion())
                    .orElseThrow(() -> new ResourceNotFoundException("LoteRecepcion", dto.getIdLoteRecepcion())));
        }

        if (dto.getIdSaca() != null) {
            Saca saca = sacaRepository.findById(dto.getIdSaca())
                    .orElseThrow(() -> new ResourceNotFoundException("Saca", dto.getIdSaca()));
            
            PaqueteSaca ps = new PaqueteSaca();
            ps.setId(new PaqueteSacaId(null, saca.getIdSaca()));
            ps.setPaquete(paquete);
            ps.setSaca(saca);
            ps.setOrdenEnSaca(1); // Default
            
            if (paquete.getPaqueteSacas() == null) {
                paquete.setPaqueteSacas(new ArrayList<>());
            }
            paquete.getPaqueteSacas().add(ps);
        }

        if (dto.getIdPaquetePadre() != null) {
            paquete.setPaquetePadre(paqueteRepository.findById(dto.getIdPaquetePadre())
                    .orElseThrow(() -> new ResourceNotFoundException("Paquete", dto.getIdPaquetePadre())));
        }

        return paquete;
    }

    public void updateEntityFromDTO(Paquete paquete, PaqueteDTO dto) {
        if (dto.getNumeroGuia() != null)
            paquete.setNumeroGuia(dto.getNumeroGuia());
        if (dto.getNumeroMaster() != null)
            paquete.setNumeroMaster(dto.getNumeroMaster());
        if (dto.getPesoKilos() != null)
            paquete.setPesoKilos(dto.getPesoKilos());
        if (dto.getPesoLibras() != null)
            paquete.setPesoLibras(dto.getPesoLibras());
        if (dto.getEstado() != null)
            paquete.setEstado(dto.getEstado());
        if (dto.getTipoPaquete() != null)
            paquete.setTipoPaquete(dto.getTipoPaquete());
        // Actualizar tipoDestino - siempre actualizar si se proporciona en el DTO
        // Esto permite cambiar de AGENCIA a DOMICILIO y viceversa
        paquete.setTipoDestino(dto.getTipoDestino());
        if (dto.getEtiquetaDestinatario() != null)
            paquete.setEtiquetaDestinatario(dto.getEtiquetaDestinatario());
        if (dto.getObservaciones() != null)
            paquete.setObservaciones(dto.getObservaciones());
        if (dto.getSed() != null)
            paquete.setSed(dto.getSed());
        if (dto.getMedidas() != null)
            paquete.setMedidas(dto.getMedidas());
        if (dto.getDescripcion() != null)
            paquete.setDescripcion(dto.getDescripcion());
        if (dto.getValor() != null)
            paquete.setValor(dto.getValor());
        if (dto.getTarifaPosition() != null)
            paquete.setTarifaPosition(dto.getTarifaPosition());
        if (dto.getRef() != null)
            paquete.setRef(dto.getRef());

        // Actualizar campos de operaciones especiales
        if (dto.getEtiquetaCambiada() != null)
            paquete.setEtiquetaCambiada(dto.getEtiquetaCambiada());
        if (dto.getSeparado() != null)
            paquete.setSeparado(dto.getSeparado());
        if (dto.getUnidoEnCaja() != null)
            paquete.setUnidoEnCaja(dto.getUnidoEnCaja());
        if (dto.getFechaEtiquetaCambiada() != null)
            paquete.setFechaEtiquetaCambiada(dto.getFechaEtiquetaCambiada());
        if (dto.getFechaSeparado() != null)
            paquete.setFechaSeparado(dto.getFechaSeparado());
        if (dto.getFechaUnidoEnCaja() != null)
            paquete.setFechaUnidoEnCaja(dto.getFechaUnidoEnCaja());

        // Actualizar relaciones si se proporcionan
        if (dto.getIdPuntoOrigen() != null) {
            paquete.setPuntoOrigen(puntoOrigenRepository.findById(dto.getIdPuntoOrigen())
                    .orElseThrow(() -> new ResourceNotFoundException("PuntoOrigen", dto.getIdPuntoOrigen())));
        }

        if (dto.getIdClienteRemitente() != null) {
            paquete.setClienteRemitente(clienteRepository.findById(dto.getIdClienteRemitente())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdClienteRemitente())));
        }

        if (dto.getIdClienteDestinatario() != null) {
            paquete.setClienteDestinatario(clienteRepository.findById(dto.getIdClienteDestinatario())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", dto.getIdClienteDestinatario())));
        }

        // Actualizar agencia destino
        // Verificar el tipoDestino actualizado en el paquete (ya se actualizó arriba)
        // para decidir si limpiar o actualizar la agencia
        TipoDestino tipoDestinoActual = paquete.getTipoDestino();

        if (tipoDestinoActual != null) {
            if (tipoDestinoActual == TipoDestino.AGENCIA) {
                // Si el tipo es AGENCIA, actualizar la agencia si se proporciona
                if (dto.getIdAgenciaDestino() != null) {
                    paquete.setAgenciaDestino(agenciaRepository.findById(dto.getIdAgenciaDestino())
                            .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgenciaDestino())));
                }
                // Si no se proporciona idAgenciaDestino pero el tipo es AGENCIA, mantener la
                // agencia actual
            } else {
                // Si el tipo es DOMICILIO u otro, limpiar la agencia destino
                paquete.setAgenciaDestino(null);
            }
        } else if (dto.getIdAgenciaDestino() != null) {
            // Si tipoDestino es null pero se proporciona idAgenciaDestino, actualizar la
            // agencia
            paquete.setAgenciaDestino(agenciaRepository.findById(dto.getIdAgenciaDestino())
                    .orElseThrow(() -> new ResourceNotFoundException("Agencia", dto.getIdAgenciaDestino())));
        }

        // Actualizar destinatario directo según tipoDestino
        if (tipoDestinoActual != null) {
            if (tipoDestinoActual == TipoDestino.DOMICILIO) {
                // Si el tipo es DOMICILIO, actualizar o limpiar destinatario directo
                if (dto.getIdDestinatarioDirecto() != null) {
                    paquete.setDestinatarioDirecto(
                            destinatarioDirectoRepository.findById(dto.getIdDestinatarioDirecto())
                                    .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto",
                                            dto.getIdDestinatarioDirecto())));
                } else {
                    paquete.setDestinatarioDirecto(null);
                }
            } else {
                // Si no es DOMICILIO, limpiar destinatario directo
                paquete.setDestinatarioDirecto(null);
            }
        } else if (dto.getIdDestinatarioDirecto() != null) {
            // Si tipoDestino es null pero se proporciona idDestinatarioDirecto, actualizar
            paquete.setDestinatarioDirecto(destinatarioDirectoRepository.findById(dto.getIdDestinatarioDirecto())
                    .orElseThrow(() -> new ResourceNotFoundException("DestinatarioDirecto",
                            dto.getIdDestinatarioDirecto())));
        }
    }

    public PaqueteDTO toDTO(Paquete paquete) {
        PaqueteDTO dto = new PaqueteDTO();
        dto.setIdPaquete(paquete.getIdPaquete());
        dto.setNumeroGuia(paquete.getNumeroGuia());
        dto.setNumeroMaster(paquete.getNumeroMaster());
        dto.setPesoKilos(paquete.getPesoKilos());
        dto.setPesoLibras(paquete.getPesoLibras());
        dto.setEstado(paquete.getEstado());
        dto.setTipoPaquete(paquete.getTipoPaquete());
        dto.setTipoDestino(paquete.getTipoDestino());
        if (paquete.getDestinatarioDirecto() != null) {
            dto.setIdDestinatarioDirecto(paquete.getDestinatarioDirecto().getIdDestinatarioDirecto());
        }
        dto.setEtiquetaDestinatario(paquete.getEtiquetaDestinatario());
        dto.setObservaciones(paquete.getObservaciones());
        dto.setSed(paquete.getSed());
        dto.setMedidas(paquete.getMedidas());
        dto.setDescripcion(paquete.getDescripcion());
        dto.setValor(paquete.getValor());
        dto.setTarifaPosition(paquete.getTarifaPosition());
        dto.setRef(paquete.getRef());
        dto.setFechaRegistro(paquete.getFechaRegistro());
        dto.setFechaRecepcion(paquete.getFechaRecepcion());
        dto.setFechaEnsacado(paquete.getFechaEnsacado());

        // Campos de operaciones especiales
        dto.setEtiquetaCambiada(paquete.getEtiquetaCambiada());
        dto.setSeparado(paquete.getSeparado());
        dto.setUnidoEnCaja(paquete.getUnidoEnCaja());
        dto.setFechaEtiquetaCambiada(paquete.getFechaEtiquetaCambiada());
        dto.setFechaSeparado(paquete.getFechaSeparado());
        dto.setFechaUnidoEnCaja(paquete.getFechaUnidoEnCaja());

        if (paquete.getPuntoOrigen() != null) {
            dto.setIdPuntoOrigen(paquete.getPuntoOrigen().getIdPuntoOrigen());
            dto.setNombrePuntoOrigen(paquete.getPuntoOrigen().getNombrePuntoOrigen());
        }
        if (paquete.getClienteRemitente() != null) {
            dto.setIdClienteRemitente(paquete.getClienteRemitente().getIdCliente());
            dto.setNombreClienteRemitente(paquete.getClienteRemitente().getNombreCompleto());

            dto.setPaisRemitente(paquete.getClienteRemitente().getPais());
            dto.setProvinciaRemitente(paquete.getClienteRemitente().getProvincia());
            dto.setCantonRemitente(paquete.getClienteRemitente().getCanton());
            dto.setDireccionRemitente(paquete.getClienteRemitente().getDireccion());
            dto.setDireccionRemitenteCompleta(construirDireccionCompleta(
                    paquete.getClienteRemitente().getDireccion(),
                    paquete.getClienteRemitente().getCanton(),
                    paquete.getClienteRemitente().getProvincia(),
                    paquete.getClienteRemitente().getPais()));
        }
        if (paquete.getClienteDestinatario() != null) {
            dto.setIdClienteDestinatario(paquete.getClienteDestinatario().getIdCliente());
            dto.setNombreClienteDestinatario(paquete.getClienteDestinatario().getNombreCompleto());
            dto.setDocumentoDestinatario(paquete.getClienteDestinatario().getDocumentoIdentidad());

            dto.setPaisDestinatario(paquete.getClienteDestinatario().getPais());
            dto.setProvinciaDestinatario(paquete.getClienteDestinatario().getProvincia());
            dto.setCantonDestinatario(paquete.getClienteDestinatario().getCanton());
            dto.setDireccionDestinatario(paquete.getClienteDestinatario().getDireccion());
            dto.setTelefonoDestinatario(paquete.getClienteDestinatario().getTelefono());
            dto.setDireccionDestinatarioCompleta(construirDireccionCompleta(
                    paquete.getClienteDestinatario().getDireccion(),
                    paquete.getClienteDestinatario().getCanton(),
                    paquete.getClienteDestinatario().getProvincia(),
                    paquete.getClienteDestinatario().getPais()));
        }
        if (paquete.getAgenciaDestino() != null) {
            dto.setIdAgenciaDestino(paquete.getAgenciaDestino().getIdAgencia());
            dto.setNombreAgenciaDestino(paquete.getAgenciaDestino().getNombre());
            dto.setCodigoAgenciaDestino(paquete.getAgenciaDestino().getCodigo());
            dto.setCantonAgenciaDestino(paquete.getAgenciaDestino().getCanton());
        }

        if (paquete.getLoteRecepcion() != null) {
            dto.setIdLoteRecepcion(paquete.getLoteRecepcion().getIdLoteRecepcion());
            dto.setNumeroRecepcion(paquete.getLoteRecepcion().getNumeroRecepcion());
        }

        // Despacho: solo rellenar idDespacho y datos del despacho cuando la saca tiene despacho asignado
        if (paquete.getPaqueteSacas() != null && !paquete.getPaqueteSacas().isEmpty()) {
            // Usar la saca más reciente
            paquete.getPaqueteSacas().stream()
                .map(PaqueteSaca::getSaca)
                .max(Comparator.comparing(Saca::getFechaCreacion))
                .ifPresent(saca -> {
                    dto.setIdSaca(saca.getIdSaca());
                    dto.setNumeroSaca(saca.getCodigoQr());
                    var despacho = saca.getDespacho();
                    if (despacho != null && despacho.getIdDespacho() != null) {
                        dto.setIdDespacho(despacho.getIdDespacho());
                        dto.setNumeroManifiesto(despacho.getNumeroManifiesto());
                        if (despacho.getAgencia() != null) {
                            dto.setNombreAgenciaDespacho(despacho.getAgencia().getNombre());
                            dto.setCantonAgenciaDespacho(despacho.getAgencia().getCanton());
                        }
                        if (despacho.getDestinatarioDirecto() != null) {
                            var dd = despacho.getDestinatarioDirecto();
                            dto.setNombreDestinatarioDirectoDespacho(dd.getNombreDestinatario() != null ? dd.getNombreDestinatario() : dd.getNombreEmpresa());
                            List<String> partesDir = new ArrayList<>();
                            if (dd.getDireccionDestinatario() != null && !dd.getDireccionDestinatario().isBlank()) {
                                partesDir.add(dd.getDireccionDestinatario().trim());
                            }
                            if (dd.getCanton() != null && !dd.getCanton().isBlank()) {
                                partesDir.add(dd.getCanton().trim());
                            }
                            if (!partesDir.isEmpty()) {
                                dto.setDireccionDestinatarioDirectoDespacho(String.join(", ", partesDir));
                            }
                        }
                    }
                });
        }

        if (paquete.getPaquetePadre() != null) {
            dto.setIdPaquetePadre(paquete.getPaquetePadre().getIdPaquete());
            dto.setNumeroGuiaPaquetePadre(paquete.getPaquetePadre().getNumeroGuia());
        }

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
}
