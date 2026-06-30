package com.candas.candas_backend;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class ModulithTest {

    @Test
    void verifyModulith() {
        // En una arquitectura por capas tradicional, Spring Modulith tratará cada subpaquete directo de la raíz como un módulo.
        // Esto permite auditar la arquitectura por capas y exportar su diagrama de acoplamiento actual.
        ApplicationModules modules = ApplicationModules.of(CandasBackendApplication.class);
        System.out.println(modules);
        
        // Generar documentación PlantUML y de componentes en target/spring-modulith-docs/
        new Documenter(modules).writeModulesAsPlantUml();
    }
}
