package com.candas.candas_backend.validation;

import com.candas.candas_backend.entity.Paquete;
import com.candas.candas_backend.entity.enums.TipoDestino;
import com.candas.candas_backend.entity.enums.TipoPaquete;
import com.candas.candas_backend.exception.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class PaqueteValidator {

    public void validatePaquete(Paquete paquete) {
        // Validar que si es SEPARAR y tiene padre, debe tener guía propia, etiqueta, o el padre debe tener guía (guía origen)
        if (paquete.getTipoPaquete() == TipoPaquete.SEPARAR && paquete.getPaquetePadre() != null) {
            boolean tieneGuia = paquete.getNumeroGuia() != null && !paquete.getNumeroGuia().trim().isEmpty();
            boolean tieneEtiqueta = paquete.getEtiquetaDestinatario() != null && !paquete.getEtiquetaDestinatario().trim().isEmpty();
            boolean padreTieneGuia = paquete.getPaquetePadre().getNumeroGuia() != null && !paquete.getPaquetePadre().getNumeroGuia().trim().isEmpty();
            if (!tieneGuia && !tieneEtiqueta && !padreTieneGuia) {
                throw new BadRequestException(
                        "Los paquetes hijos SEPARAR deben tener número de guía, etiqueta de destinatario, o el paquete padre debe tener número de guía (guía origen).");
            }
        }

        // Validar que si el destino es AGENCIA, debe tener agencia destino
        if (paquete.getTipoDestino() == TipoDestino.AGENCIA && paquete.getAgenciaDestino() == null) {
            throw new BadRequestException("Los paquetes con destino AGENCIA deben tener una agencia destino");
        }
    }

    /**
     * Validación para cambio masivo de tipo de paquete.
     * No requiere agencia destino para tipo AGENCIA, ya que se asignará después en
     * el despacho.
     */
    public void validatePaqueteParaCambioMasivo(Paquete paquete) {
        // Validar que si es SEPARAR y tiene padre, debe tener guía propia, etiqueta, o el padre debe tener guía (guía origen)
        if (paquete.getTipoPaquete() == TipoPaquete.SEPARAR && paquete.getPaquetePadre() != null) {
            boolean tieneGuia = paquete.getNumeroGuia() != null && !paquete.getNumeroGuia().trim().isEmpty();
            boolean tieneEtiqueta = paquete.getEtiquetaDestinatario() != null && !paquete.getEtiquetaDestinatario().trim().isEmpty();
            boolean padreTieneGuia = paquete.getPaquetePadre().getNumeroGuia() != null && !paquete.getPaquetePadre().getNumeroGuia().trim().isEmpty();
            if (!tieneGuia && !tieneEtiqueta && !padreTieneGuia) {
                throw new BadRequestException(
                        "Los paquetes hijos SEPARAR deben tener número de guía, etiqueta de destinatario, o el paquete padre debe tener número de guía (guía origen).");
            }
        }

        // NO validar agencia destino para tipo AGENCIA en cambio masivo
        // La agencia se asignará después en el despacho
    }
}
