# Candas - Instrucciones permanentes para IA y agentes

## Identidad fija

- Proyecto: Candas v3. [verificado en documentacion]
- Repositorio: `BackSet/candas_v3`. [verificado en Git]
- Rama base: `dev`. [verificado en Git]
- Entorno principal para esta auditoria: local. [verificado en documentacion de la solicitud]
- Ruta canonica de contexto IA: `docs/ai`. [verificado en Git]
- Nivel de detalle esperado para agentes: detallado, con evidencia explicita. [verificado en documentacion de la solicitud]

## Rol del analista y del agente

- Actuar como agente de implementacion senior: inspeccionar primero, editar despues, verificar al final. [verificado en documentacion de la solicitud]
- Priorizar el estado real de la rama activa sobre memoria, supuestos o documentacion antigua. [verificado en documentacion de la solicitud]
- Marcar cada afirmacion relevante con una de estas etiquetas: `[verificado en Git]`, `[verificado en documentacion]`, `[inferido]`, `[pendiente de confirmar]`. [verificado en documentacion de la solicitud]
- No presentar inferencias o pendientes como hechos confirmados. [verificado en documentacion de la solicitud]

## Fuentes de verdad

Orden de prioridad:

1. Codigo actual, manifiestos, configuracion ejecutable, migraciones, contratos, tests y scripts de la rama `dev`. [verificado en Git]
2. README y documentacion en `docs/`, `candas-backend/docs` y `candas-frontend/docs`, siempre que no contradigan lo ejecutable. [verificado en documentacion]
3. Archivos `.env.example`, Dockerfile, `railway.json` y configuracion de perfiles para variables y despliegue. [verificado en Git]
4. Inferencias razonables desde estructura y nombres solo si se etiquetan como `[inferido]`. [inferido]

No usar como fuente canonica:

- `.env` reales, secretos, logs, `node_modules`, `dist`, `target`, caches o archivos locales de IDE. [inferido]
- Informacion externa no citada o no presente en el repo, salvo que el usuario pida investigacion externa. [inferido]

## Reglas de aislamiento

- Antes de editar, ejecutar o revisar: remoto, rama activa y `git status`. [verificado en documentacion de la solicitud]
- Confirmar que el remoto corresponde a `BackSet/candas_v3` y que la rama activa es `dev`. [verificado en documentacion de la solicitud]
- No sobrescribir cambios locales ajenos. Si existen cambios no relacionados, ignorarlos; si afectan el archivo a tocar, leerlos y trabajar con ellos. [inferido]
- Para tareas de documentacion IA, modificar solo `docs/ai` salvo autorizacion explicita. [verificado en documentacion de la solicitud]
- No hacer commit ni push sin autorizacion explicita del usuario. [verificado en documentacion de la solicitud]

## Restricciones permanentes

- No modificar codigo funcional fuera del alcance. [verificado en documentacion de la solicitud]
- No modificar migraciones historicas. [verificado en documentacion de la solicitud]
- No agregar dependencias sin requerimiento explicito y validacion de impacto. [verificado en documentacion de la solicitud]
- No inventar modulos, rutas, endpoints, tablas, permisos, comandos, tecnologias ni dependencias. [verificado en documentacion de la solicitud]
- No asumir subcarpetas `standards/` o `templates/`. [verificado en documentacion de la solicitud]
- No convertir los archivos canonicos en changelog. [verificado en documentacion de la solicitud]
- No duplicar documentacion extensa si existe una fuente canonica; enlazar o resumir. [verificado en documentacion de la solicitud]
- Mantener idioma, casing, arquitectura, convenciones y patrones existentes salvo que la tarea pida cambiarlos. [verificado en documentacion de la solicitud]
- UI/UX: seguir el contrato de [`docs/ai/UI_UX_BASE.md`](UI_UX_BASE.md). Reutilizar tokens (`src/index.css`) y componentes existentes (`components/ui`, `components/states`, layouts) antes de crear nuevos; no usar paletas crudas de Tailwind (usar tokens semánticos). [verificado en Git]

## Mantenimiento obligatorio de contexto IA

Despues de cada implementacion que cambie comportamiento, arquitectura, rutas, endpoints, tablas, migraciones, permisos, stack, comandos, configuracion, despliegue o nomenclatura:

- Revisar `docs/ai/PROJECT_CONTEXT.md`. [verificado en documentacion de la solicitud]
- Revisar `docs/ai/MODULE_MAP.md`. [verificado en documentacion de la solicitud]
- Revisar `docs/ai/NAMING.md`. [verificado en documentacion de la solicitud]
- Revisar `docs/ai/PROJECT_INSTRUCTIONS.md`. [verificado en documentacion de la solicitud]
- Revisar `docs/ai/UI_UX_BASE.md` cuando el cambio afecte UI, tokens, componentes base, tema o patrones de pantalla. [verificado en Git]
- Actualizar solo informacion canonica real y vigente. [verificado en documentacion de la solicitud]
- Marcar incertidumbres como `[pendiente de confirmar]`. [verificado en documentacion de la solicitud]

## Protocolo recomendado para futuras tareas

1. Confirmar ubicacion, remoto, rama y estado:

```bash
git remote -v
git branch --show-current
git status --short --branch
```

2. Leer los cuatro archivos de `docs/ai` antes de implementar cambios de alcance medio o alto. [inferido]
3. Inspeccionar los archivos del modulo afectado: frontend, backend, DB, permisos, docs y tests relacionados. [inferido]
4. Implementar el cambio minimo que satisfaga el alcance. [inferido]
5. Ejecutar validaciones razonables segun el area:

```bash
cd candas-frontend && npm run lint
cd candas-frontend && npm run test:run
cd candas-frontend && npm run build
cd candas-backend && ./mvnw -DskipTests compile
cd candas-backend && ./mvnw test
```

- Ejecutar solo las que correspondan al cambio y al tiempo disponible; si no se ejecutan, reportarlo. [inferido]

6. Actualizar `docs/ai` si el cambio afecta contexto canonico. [verificado en documentacion de la solicitud]
7. Terminar con `git status --short` y reporte final. [verificado en documentacion de la solicitud]

## Regla de no implementar fuera del alcance

- Si la tarea pide auditar/crear contexto, no tocar codigo funcional. [verificado en documentacion de la solicitud]
- Si durante la inspeccion aparece una discrepancia no bloqueante, documentarla como pendiente; no corregirla salvo que el usuario lo pida. [inferido]
- Si una discrepancia bloquea el objetivo, explicarla, proponer opciones y esperar instruccion si no hay una solucion segura dentro del alcance. [inferido]

## Formato de reporte final

El reporte final debe incluir:

- Archivos creados o modificados. [verificado en documentacion de la solicitud]
- Evidencia clave usada. [verificado en documentacion de la solicitud]
- Validacion ejecutada, especialmente `git status --short`. [verificado en documentacion de la solicitud]
- Pendientes o incertidumbres marcadas como tales. [verificado en documentacion de la solicitud]
- Confirmacion de que no hubo cambios fuera del alcance cuando aplique. [verificado en documentacion de la solicitud]

## Protocolo de continuidad

Si una sesion queda incompleta:

- No ocultar el estado parcial. [inferido]
- Dejar indicado que archivo o seccion falta revisar. [inferido]
- Mantener cualquier dato no confirmado como `[pendiente de confirmar]`. [verificado en documentacion de la solicitud]
- Al retomar, empezar por `git status --short --branch` y revisar cambios locales antes de seguir. [inferido]

## Pendientes de confirmar

- Politica de CI automatizado oficial para este repositorio. [pendiente de confirmar]
- Matriz minima obligatoria de pruebas por tipo de cambio. [pendiente de confirmar]
- Decision formal sobre limpieza o mantenimiento de nombres historicos todavia presentes en frontend. [pendiente de confirmar]
