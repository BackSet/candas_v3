#!/bin/sh
# Se ejecuta antes de envsubst (imagen oficial nginx). Si PORT llega vacío, la
# plantilla generaría "listen 0.0.0.0:;" y Nginx no arranca → 502 en Railway.
_port="${PORT:-80}"
# Quitar espacios/saltos por si la variable viene mal formateada en el panel.
export PORT=$(printf '%s' "$_port" | tr -d ' \t\r\n')
[ -n "$PORT" ] || export PORT=80
