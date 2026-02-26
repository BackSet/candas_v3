package com.candas.candas_backend.util;

import org.apache.poi.ss.usermodel.*;

public class ExcelHelper {

    private ExcelHelper() {
        // Private constructor to hide the implicit public one
    }

    public static String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }

        try {
            CellType cellType = cell.getCellType();

            if (cellType == CellType.FORMULA) {
                cellType = cell.getCachedFormulaResultType();
            }

            switch (cellType) {
                case STRING:
                    return cell.getStringCellValue();
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toString();
                    } else {
                        double numericValue = cell.getNumericCellValue();
                        if (numericValue == (long) numericValue) {
                            return String.valueOf((long) numericValue);
                        } else {
                            return String.valueOf(numericValue);
                        }
                    }
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case BLANK:
                case ERROR:
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    public static String getCellValueAsStringSafe(Row row, int columnIndex) {
        try {
            if (row == null) {
                return null;
            }
            Cell cell = row.getCell(columnIndex);
            return getCellValueAsString(cell);
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String cellValue = getCellValueAsString(cell);
                if (cellValue != null && !cellValue.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }
}
