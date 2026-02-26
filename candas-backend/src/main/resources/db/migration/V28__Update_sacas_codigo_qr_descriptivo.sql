-- Actualizar código QR de sacas existentes al formato descriptivo
-- Formato: SACA-numeroManifiesto-numeroOrden
UPDATE saca s
SET codigo_qr = 'SACA-' || d.numero_manifiesto || '-' || s.numero_orden
FROM despacho d
WHERE s.id_despacho = d.id_despacho
  AND s.codigo_qr IS NOT NULL
  AND s.codigo_qr ~ '^[0-9]+$'  -- Solo actualizar si el código QR actual es solo numérico
  AND d.numero_manifiesto IS NOT NULL
  AND s.numero_orden IS NOT NULL;
