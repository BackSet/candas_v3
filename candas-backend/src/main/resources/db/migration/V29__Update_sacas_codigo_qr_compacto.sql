-- Actualizar código QR de sacas existentes al formato descriptivo compacto
-- Formato: SAC-codigoHexDespacho-orden (ej: SAC-001E9F80-01)
-- Nota: Los números de manifiesto se actualizarán automáticamente al nuevo formato cuando se creen nuevos despachos
-- Para despachos existentes, usamos el ID del despacho convertido a hexadecimal

-- Actualizar códigos QR de sacas al nuevo formato compacto
UPDATE saca s
SET codigo_qr = 'SAC-' || LPAD(UPPER(to_hex(d.id_despacho)), 8, '0') || '-' || LPAD(s.numero_orden::TEXT, 2, '0')
FROM despacho d
WHERE s.id_despacho = d.id_despacho
  AND s.codigo_qr IS NOT NULL
  AND (s.codigo_qr ~ '^[0-9]+$' OR s.codigo_qr LIKE 'SACA-%' OR s.codigo_qr LIKE 'SAC-%')  -- Actualizar si es numérico, formato antiguo o formato intermedio
  AND d.id_despacho IS NOT NULL
  AND s.numero_orden IS NOT NULL;
