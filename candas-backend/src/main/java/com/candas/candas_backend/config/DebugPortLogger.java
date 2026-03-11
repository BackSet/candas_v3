package com.candas.candas_backend.config;

import org.springframework.boot.web.server.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * Muestra en consola la URL en la que escucha la API al arrancar el servidor.
 */
@Component
public class DebugPortLogger implements ApplicationListener<WebServerInitializedEvent> {

    @Override
    public void onApplicationEvent(WebServerInitializedEvent event) {
        int port = event.getWebServer().getPort();
        System.out.println("\n>>> Candas API escuchando en http://localhost:" + port + " - Mantenga este proceso en ejecución para usar el frontend.\n");
    }
}
