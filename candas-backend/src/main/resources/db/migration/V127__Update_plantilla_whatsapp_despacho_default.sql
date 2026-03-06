-- Migración V127: Actualizar plantilla por defecto de WhatsApp despacho al formato solicitado
UPDATE parametro_sistema
SET valor = '*DESPACHO ENVIADO*
━━━━━━━━━━━━━━━━━━━━

*Manifiesto:* {{numero_manifiesto}}
*Fecha:* {{fecha_despacho}}

*Destino:* {{destinatario_directo}}
*Encargado:* {{encargado}}

*Distribuidor:* {{distribuidor}}
*Guía:* {{guia}}

*RESUMEN*
• {{cantidad_sacas}} Sacas
• {{cantidad_paquetes}} Paquetes

*DETALLE*
{{detalle_sacas}}

*IMPORTANTE:*
Al recibir la carga, por favor verifique que el número de paquetes recibidos corresponda con los {{cantidad_paquetes}} paquetes enviados según este manifiesto.

*NOTA:* El documento PDF del despacho está disponible para descarga.

*¡Gracias por su confianza!*'
WHERE clave = 'whatsapp_mensaje_despacho';
