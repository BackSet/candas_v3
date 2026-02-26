# Uso de JasperReports 7 en Candas Backend

## Motor moderno y fugas de memoria

En **JasperReports 7.0.3** (y 7.x), el compilador antiguo usado por los métodos estáticos de `JasperCompileManager` (por ejemplo `compileReport(InputStream)`) puede provocar **fugas de memoria** cuando se compilan o generan muchos reportes (p. ej. manifiestos de carga masivos).

### Recomendaciones para generación de reportes PDF

1. **No usar los métodos estáticos de `JasperCompileManager`** de forma repetida en bucles o bajo carga. Evitar en particular:
   - `JasperCompileManager.compileReport(InputStream)`
   - `JasperCompileManager.compileReport(String path)`
   en cada petición o por cada reporte en una generación masiva.

2. **Usar el API basado en contexto (motor moderno)**:
   - Crear un `JasperReportsContext` (p. ej. `SimpleJasperReportsContext`).
   - Configurar el compilador si hace falta.
   - Obtener instancias de compilación/llenado desde ese contexto:
     - `JasperCompileManager.getInstance(jasperReportsContext)`
     - Compilar cada `.jrxml` **una vez** (al arranque o en un bean) y reutilizar los `JasperReport` compilados para múltiples `JasperFillManager.fillReport(...)`.

3. **Para generación masiva (manifiestos de carga, etc.)**:
   - **Precompilar** plantillas a `.jasper` en build o al inicio de la aplicación.
   - En runtime usar solo `JasperFillManager` con datos; **evitar compilar en cada petición**.
   - Cerrar/liberar recursos de `JasperPrint` y streams según las buenas prácticas de la documentación de JasperReports 7.

### Ejemplo de patrón recomendado (cuando se implemente generación PDF)

```java
// Al arranque o en un @Bean: compilar una vez
JasperReportsContext jrContext = new SimpleJasperReportsContext();
JasperCompileManager compileManager = JasperCompileManager.getInstance(jrContext);
JasperReport report = compileManager.compile("classpath:reports/manifiesto.jrxml");

// En cada generación: solo llenar y exportar
JasperPrint print = JasperFillManager.getInstance(jrContext).fillReport(report, params, dataSource);
byte[] pdf = JasperExportManager.exportReportToPdf(print);
// Cerrar/liberar print y streams según documentación
```

No usar en bucle:

```java
// EVITAR: compilar en cada iteración
for (...) {
  JasperReport report = JasperCompileManager.compileReport(inputStream); // Fugas de memoria
  ...
}
```

---

*Este documento debe tenerse en cuenta en cualquier implementación futura de generación de reportes PDF (p. ej. manifiestos de carga masivos) con JasperReports 7.x.*
