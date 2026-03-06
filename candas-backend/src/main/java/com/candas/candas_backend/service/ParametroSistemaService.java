package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.PlantillaWhatsAppDespachoDTO;
import com.candas.candas_backend.entity.ParametroSistema;
import com.candas.candas_backend.repository.ParametroSistemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ParametroSistemaService {

    public static final String CLAVE_WHATSAPP_MENSAJE_DESPACHO = "whatsapp_mensaje_despacho";

    private final ParametroSistemaRepository parametroSistemaRepository;

    public ParametroSistemaService(ParametroSistemaRepository parametroSistemaRepository) {
        this.parametroSistemaRepository = parametroSistemaRepository;
    }

    public String getValor(String clave) {
        return parametroSistemaRepository.findByClave(clave)
                .map(ParametroSistema::getValor)
                .orElse("");
    }

    public void guardar(String clave, String valor) {
        ParametroSistema param = parametroSistemaRepository.findByClave(clave)
                .orElseGet(() -> {
                    var p = new ParametroSistema();
                    p.setClave(clave);
                    return p;
                });
        param.setValor(valor != null ? valor : "");
        parametroSistemaRepository.save(param);
    }

    public PlantillaWhatsAppDespachoDTO getPlantillaWhatsAppDespacho() {
        String plantilla = getValor(CLAVE_WHATSAPP_MENSAJE_DESPACHO);
        return new PlantillaWhatsAppDespachoDTO(plantilla);
    }

    public void guardarPlantillaWhatsAppDespacho(String plantilla) {
        guardar(CLAVE_WHATSAPP_MENSAJE_DESPACHO, plantilla != null ? plantilla : "");
    }
}
