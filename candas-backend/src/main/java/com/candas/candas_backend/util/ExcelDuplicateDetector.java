package com.candas.candas_backend.util;

import com.candas.candas_backend.dto.PaqueteNoImportadoDTO;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utilidad para detectar números de guía duplicados en archivos Excel.
 * Elimina duplicación de código entre servicios de importación.
 */
public class ExcelDuplicateDetector {

    /**
     * Detecta números de guía duplicados en una hoja de Excel.
     * 
     * @param sheet La hoja de Excel a analizar
     * @param columnaIndice El índice de la columna que contiene el número de guía (0-based)
     * @param filaInicio La primera fila a procesar (0-based, típicamente 1 o 2 para saltar headers)
     * @param getCellValueAsString Función para obtener el valor de la celda como String
     * @return Un objeto DuplicateDetectionResult con los duplicados encontrados
     */
    public static DuplicateDetectionResult detectarDuplicados(
            Sheet sheet,
            int columnaIndice,
            int filaInicio,
            CellValueExtractor getCellValueAsString) {
        
        Map<String, List<Integer>> numerosGuiaPorFila = new HashMap<>();
        Map<String, String> numeroGuiaOriginal = new HashMap<>(); // Para mantener el formato original
        
        for (int i = filaInicio; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            String numeroGuia = extraerNumeroGuia(row, columnaIndice, getCellValueAsString);
            if (numeroGuia != null && !numeroGuia.trim().isEmpty()) {
                String numeroGuiaNormalizado = numeroGuia.trim().toUpperCase();
                // Guardar el formato original del primer número de guía encontrado
                if (!numeroGuiaOriginal.containsKey(numeroGuiaNormalizado)) {
                    numeroGuiaOriginal.put(numeroGuiaNormalizado, numeroGuia.trim());
                }
                numerosGuiaPorFila.computeIfAbsent(numeroGuiaNormalizado, k -> new ArrayList<>()).add(i + 1);
            }
        }
        
        List<String> numerosGuiaDuplicados = new ArrayList<>();
        List<PaqueteNoImportadoDTO> paquetesNoImportados = new ArrayList<>();
        
        for (Map.Entry<String, List<Integer>> entry : numerosGuiaPorFila.entrySet()) {
            if (entry.getValue().size() > 1) {
                // Usar el formato original del número de guía
                String numeroGuiaOriginalFormato = numeroGuiaOriginal.getOrDefault(entry.getKey(), entry.getKey());
                numerosGuiaDuplicados.add(numeroGuiaOriginalFormato);
                // Agregar todas las filas duplicadas excepto la primera
                for (int j = 1; j < entry.getValue().size(); j++) {
                    PaqueteNoImportadoDTO noImportado = new PaqueteNoImportadoDTO();
                    noImportado.setNumeroGuia(numeroGuiaOriginalFormato);
                    noImportado.setMotivo("Número de guía duplicado en el archivo (aparece en filas: " + entry.getValue() + ")");
                    noImportado.setNumeroFila(entry.getValue().get(j));
                    paquetesNoImportados.add(noImportado);
                }
            }
        }
        
        return new DuplicateDetectionResult(numerosGuiaPorFila, numerosGuiaDuplicados, paquetesNoImportados);
    }

    private static String extraerNumeroGuia(Row row, int columnaIndice, CellValueExtractor extractor) {
        Cell cell = row.getCell(columnaIndice);
        if (cell == null) {
            return null;
        }
        return extractor.extract(cell);
    }

    /**
     * Interfaz funcional para extraer el valor de una celda como String.
     * Permite que cada servicio use su propia implementación de getCellValueAsString.
     */
    @FunctionalInterface
    public interface CellValueExtractor {
        String extract(Cell cell);
    }

    /**
     * Resultado de la detección de duplicados.
     */
    public static class DuplicateDetectionResult {
        private final Map<String, List<Integer>> numerosGuiaPorFila;
        private final List<String> numerosGuiaDuplicados;
        private final List<PaqueteNoImportadoDTO> paquetesNoImportados;

        public DuplicateDetectionResult(
                Map<String, List<Integer>> numerosGuiaPorFila,
                List<String> numerosGuiaDuplicados,
                List<PaqueteNoImportadoDTO> paquetesNoImportados) {
            this.numerosGuiaPorFila = numerosGuiaPorFila;
            this.numerosGuiaDuplicados = numerosGuiaDuplicados;
            this.paquetesNoImportados = paquetesNoImportados;
        }

        public Map<String, List<Integer>> getNumerosGuiaPorFila() {
            return numerosGuiaPorFila;
        }

        public List<String> getNumerosGuiaDuplicados() {
            return numerosGuiaDuplicados;
        }

        public List<PaqueteNoImportadoDTO> getPaquetesNoImportados() {
            return paquetesNoImportados;
        }
    }
}
