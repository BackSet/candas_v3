# Requerimientos Técnicos - Sistema de Reutilización de Códigos

## Índice

1. [Requerimientos de Hardware](#requerimientos-de-hardware)
2. [Requerimientos de Software](#requerimientos-de-software)
3. [Formatos de Etiqueta](#formatos-de-etiqueta)
4. [Base de Datos](#base-de-datos)
5. [APIs y Integraciones](#apis-y-integraciones)
6. [Seguridad](#seguridad)
7. [Rendimiento](#rendimiento)

---

## Requerimientos de Hardware

### Escáner de Códigos de Barras

#### Opción 1: Escáner USB

**Especificaciones:**
- Tipo: Escáner láser o CCD
- Conexión: USB 2.0 o superior
- Compatibilidad: HID (Human Interface Device) - emula teclado
- Formatos soportados: Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, QR Code
- Velocidad de lectura: Mínimo 100 escaneos/minuto
- Distancia de lectura: 5-30 cm (dependiendo del modelo)

**Modelos Recomendados:**
- Honeywell Voyager 1200g
- Symbol LS2208
- Datalogic QuickScan QD2430
- Zebra DS2208

**Ventajas:**
- Fácil instalación (plug and play)
- No requiere drivers especiales
- Funciona en cualquier sistema operativo
- Bajo costo

**Desventajas:**
- Requiere cable USB
- Limitado por longitud del cable

---

#### Opción 2: Escáner Bluetooth

**Especificaciones:**
- Tipo: Escáner láser o CCD inalámbrico
- Conexión: Bluetooth 4.0 o superior
- Compatibilidad: HID Bluetooth
- Formatos soportados: Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, QR Code
- Alcance: Hasta 10 metros
- Batería: Recargable, duración 8-12 horas

**Modelos Recomendados:**
- Honeywell Voyager 1250g
- Symbol LS4278
- Datalogic QuickScan QD2430 BT
- Zebra DS8178

**Ventajas:**
- Movilidad sin cables
- Ideal para ambientes grandes
- Múltiples dispositivos pueden usar el mismo escáner

**Desventajas:**
- Requiere emparejamiento inicial
- Depende de batería
- Mayor costo

---

#### Opción 3: Cámara del Dispositivo

**Especificaciones:**
- Tipo: Cámara integrada en dispositivo móvil/tablet
- Resolución mínima: 2MP
- Enfoque: Auto-focus
- Iluminación: Flash LED opcional

**Requisitos:**
- Navegador con soporte para MediaDevices API
- Permisos de cámara en el navegador
- Buena iluminación del ambiente

**Ventajas:**
- No requiere hardware adicional
- Funciona en dispositivos móviles
- Gratis (usa hardware existente)

**Desventajas:**
- Menor velocidad que escáner dedicado
- Requiere buena iluminación
- Puede ser menos preciso

**Librerías Recomendadas:**
- ZXing (JavaScript)
- QuaggaJS
- html5-qrcode

---

### Impresoras

#### Impresoras Estándar (PDF)

**Especificaciones:**
- Tipo: Láser o inyección de tinta
- Tamaño de papel: 4x6 pulgadas (etiquetas) o A4
- Resolución: Mínimo 300 DPI
- Conexión: USB, Ethernet o Wi-Fi
- Compatibilidad: PostScript o PCL

**Modelos Recomendados:**
- HP LaserJet Pro
- Canon PIXMA
- Epson WorkForce
- Brother HL-L series

**Requisitos:**
- Soporte para impresión de etiquetas
- Trayectoria recta de papel (para etiquetas adhesivas)

---

#### Impresoras Zebra (ZPL)

**Especificaciones:**
- Tipo: Impresora térmica de etiquetas
- Tecnología: Térmica directa o transferencia térmica
- Ancho de etiqueta: 2-4 pulgadas
- Velocidad: 4-12 pulgadas/segundo
- Resolución: 203 DPI o 300 DPI
- Conexión: USB, Ethernet, Wi-Fi, Bluetooth
- Lenguaje: ZPL (Zebra Programming Language)

**Modelos Recomendados:**

**Gama Básica:**
- Zebra ZD220 (2 pulgadas, USB/Ethernet)
- Zebra ZD420 (4 pulgadas, USB/Ethernet)
- Zebra ZD620 (4 pulgadas, USB/Ethernet/Wi-Fi)

**Gama Media:**
- Zebra ZT210 (4 pulgadas, industrial)
- Zebra ZT230 (4 pulgadas, industrial)
- Zebra GC420d (4 pulgadas, desktop)

**Gama Alta:**
- Zebra ZT410 (4 pulgadas, alta velocidad)
- Zebra ZT420 (4 pulgadas, alta velocidad)
- Zebra ZT610 (6 pulgadas, industrial)

**Requisitos Específicos:**
- Soporte ZPL nativo
- Configuración de calibración
- Rollo de etiquetas compatible
- Cinta térmica (si es transferencia térmica)

**Ventajas:**
- Impresión rápida y de alta calidad
- Diseñadas específicamente para etiquetas
- Duraderas y confiables
- Soporte para códigos de barras de alta densidad

**Desventajas:**
- Mayor costo inicial
- Requiere rollos de etiquetas especiales
- Configuración más compleja

---

## Requerimientos de Software

### Backend

#### Stack Tecnológico

**Lenguaje y Framework:**
- Java 17 o superior
- Spring Boot 3.x
- Spring Security
- Spring Data JPA

**Base de Datos:**
- PostgreSQL 12 o superior
- Flyway para migraciones

**Librerías Específicas:**
- JWT (JSON Web Tokens) para autenticación
- Apache POI para generación de documentos
- iText o Apache PDFBox para generación PDF
- ZPL Builder para generación ZPL

**Servidor:**
- Tomcat embebido (Spring Boot)
- O servidor de aplicaciones externo (Tomcat, Jetty)

**Requisitos del Sistema:**
- RAM: Mínimo 2GB, recomendado 4GB
- CPU: Mínimo 2 cores, recomendado 4 cores
- Disco: Mínimo 10GB libres
- SO: Linux, Windows Server, o macOS

---

### Frontend

#### Stack Tecnológico

**Framework:**
- React 18+
- TypeScript 5+
- Vite como build tool

**Librerías Principales:**
- React Router para navegación
- React Query para gestión de estado del servidor
- React Hook Form para formularios
- Zod para validación

**Librerías de Códigos de Barras:**
- jsbarcode para generación de códigos de barras
- ZXing-js para lectura desde cámara
- QuaggaJS como alternativa

**Librerías de PDF:**
- jsPDF para generación de PDFs
- react-pdf para visualización

**Librerías de UI:**
- Tailwind CSS para estilos
- shadcn/ui o similar para componentes
- Lucide React para iconos

**Navegadores Soportados:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+
- Opera 76+

**Requisitos del Cliente:**
- JavaScript habilitado
- Resolución mínima: 1024x768
- Conexión a internet (para acceso al sistema)

---

## Formatos de Etiqueta

### Formato PDF

#### Especificaciones Técnicas

**Tamaño Estándar:**
- 4x6 pulgadas (10.16 x 15.24 cm)
- O A4 (8.27 x 11.69 pulgadas)

**Resolución:**
- Mínimo 300 DPI para impresión de calidad
- 600 DPI recomendado para códigos de barras

**Contenido de la Etiqueta:**
- Código de barras (Code 128 o Code 39)
- Información del remitente
- Información del destinatario
- Dirección completa
- Fecha de creación
- Número de paquete/guía

**Estructura Visual:**
```
┌─────────────────────────────┐
│  [CÓDIGO DE BARRAS]         │
│                             │
│  DE: Remitente              │
│  Dirección remitente        │
│                             │
│  PARA: Destinatario         │
│  Dirección destinatario     │
│  Ciudad, Estado, CP         │
│                             │
│  Fecha: DD/MM/YYYY          │
│  Guía: XXXXXXXXXX           │
└─────────────────────────────┘
```

**Librerías para Generación:**
- jsPDF (JavaScript)
- iText (Java)
- Apache PDFBox (Java)

**Ventajas:**
- Compatible con cualquier impresora
- Fácil de visualizar y editar
- Estándar universal

**Desventajas:**
- Puede requerir más tinta/toner
- Menos optimizado para etiquetas pequeñas

---

### Formato ZPL (Zebra Programming Language)

#### Especificaciones Técnicas

**Tamaño Estándar:**
- 4x6 pulgadas (101.6 x 152.4 mm)
- Configurable según modelo de impresora

**Resolución:**
- 203 DPI (estándar)
- 300 DPI (alta resolución

**Estructura del Comando ZPL:**

```zpl
^XA                    # Inicio de etiqueta
^FO50,50              # Posición (x,y)
^A0N,50,50            # Fuente, altura, ancho
^FDREMITENTE^FS       # Texto
^FO50,100
^A0N,30,30
^FDDirección^FS
^FO50,200
^BY3,3,100            # Código de barras
^BCN,100,Y,N,N        # Code 128, altura, lectura humana
^FD123456789^FS       # Datos del código
^XZ                    # Fin de etiqueta
```

**Elementos Principales:**
- `^XA` / `^XZ`: Inicio/Fin de etiqueta
- `^FO`: Posición (Field Origin)
- `^FD` / `^FS`: Datos de campo / Fin de campo
- `^BY`: Código de barras
- `^A0N`: Fuente
- `^GB`: Líneas y cajas

**Librerías para Generación:**
- ZPL Builder (Java)
- node-zpl2 (Node.js)
- zpl (Python)

**Ejemplo Completo:**

```zpl
^XA
^CF0,30
^FO50,30^FDREMITENTE^FS
^FO50,60^FDEmpresa ABC^FS
^FO50,90^FD123 Calle Principal^FS
^FO50,120^FDCiudad, Estado 12345^FS

^FO50,180^FDPARA:^FS
^FO50,210^FDJuan Pérez^FS
^FO50,240^FD456 Avenida Destino^FS
^FO50,270^FDCiudad Destino, Estado 67890^FS

^FO50,330^BY3,3,100
^BCN,100,Y,N,N
^FD123456789012^FS

^FO50,450^CF0,20
^FDGuía: 123456789012^FS
^FO50,480^FDFecha: 01/01/2024^FS
^XZ
```

**Ventajas:**
- Optimizado para impresoras Zebra
- Impresión rápida y de alta calidad
- Códigos de barras de alta densidad
- Eficiente en uso de etiquetas

**Desventajas:**
- Solo funciona con impresoras Zebra
- Requiere conocimiento de sintaxis ZPL
- Menos flexible que PDF

---

### Comparativa de Formatos

| Aspecto | PDF | ZPL |
|---------|-----|-----|
| **Compatibilidad** | Universal | Solo Zebra |
| **Calidad de Código** | Buena | Excelente |
| **Velocidad Impresión** | Media | Alta |
| **Facilidad de Generación** | Alta | Media |
| **Costo Impresora** | Bajo-Medio | Medio-Alto |
| **Flexibilidad** | Alta | Media |
| **Tamaño Archivo** | Mayor | Menor |

**Recomendación:**
- Usar PDF para impresoras estándar y flexibilidad
- Usar ZPL para impresoras Zebra y máxima calidad

---

## Base de Datos

### Esquema de Base de Datos

#### Tabla: `usuario`

```sql
CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `rol`

```sql
CREATE TABLE rol (
    id_rol BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `permiso`

```sql
CREATE TABLE permiso (
    id_permiso BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    recurso VARCHAR(100),
    accion VARCHAR(50)
);
```

#### Tabla: `usuario_rol`

```sql
CREATE TABLE usuario_rol (
    id_usuario_rol BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario),
    id_rol BIGINT NOT NULL REFERENCES rol(id_rol),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(id_usuario, id_rol)
);
```

#### Tabla: `rol_permiso`

```sql
CREATE TABLE rol_permiso (
    id_rol_permiso BIGSERIAL PRIMARY KEY,
    id_rol BIGINT NOT NULL REFERENCES rol(id_rol),
    id_permiso BIGINT NOT NULL REFERENCES permiso(id_permiso),
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_rol, id_permiso)
);
```

#### Tabla: `codigo_barras`

```sql
CREATE TABLE codigo_barras (
    id_codigo BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'LIBRE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_uso TIMESTAMP,
    total_usos INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_codigo_barras_codigo ON codigo_barras(codigo);
CREATE INDEX idx_codigo_barras_estado ON codigo_barras(estado);
```

**Estados posibles:**
- `LIBRE`: Disponible para reutilización
- `EN_TRANSITO`: Asignado a paquete en proceso
- `ACTIVO`: Asignado a paquete activo
- `ENTREGADO`: Paquete entregado (pronto será LIBRE)

#### Tabla: `paquete`

```sql
CREATE TABLE paquete (
    id_paquete BIGSERIAL PRIMARY KEY,
    id_codigo_barras BIGINT NOT NULL REFERENCES codigo_barras(id_codigo),
    remitente_nombre VARCHAR(255) NOT NULL,
    remitente_telefono VARCHAR(50),
    remitente_email VARCHAR(255),
    destinatario_nombre VARCHAR(255) NOT NULL,
    destinatario_telefono VARCHAR(50),
    destinatario_email VARCHAR(255),
    direccion_calle VARCHAR(255) NOT NULL,
    direccion_ciudad VARCHAR(100) NOT NULL,
    direccion_estado VARCHAR(100),
    direccion_codigo_postal VARCHAR(20),
    estado VARCHAR(50) NOT NULL DEFAULT 'EN_TRANSITO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    id_usuario_creacion BIGINT REFERENCES usuario(id_usuario),
    id_usuario_entrega BIGINT REFERENCES usuario(id_usuario),
    observaciones TEXT
);

CREATE INDEX idx_paquete_codigo ON paquete(id_codigo_barras);
CREATE INDEX idx_paquete_estado ON paquete(estado);
CREATE INDEX idx_paquete_fecha_creacion ON paquete(fecha_creacion);
CREATE INDEX idx_paquete_destinatario ON paquete(destinatario_nombre);
```

**Estados posibles:**
- `EN_TRANSITO`: Paquete en proceso de envío
- `ACTIVO`: Paquete activo en el sistema
- `ENTREGADO`: Paquete entregado al destinatario

#### Tabla: `historial_estado_paquete`

```sql
CREATE TABLE historial_estado_paquete (
    id_historial BIGSERIAL PRIMARY KEY,
    id_paquete BIGINT NOT NULL REFERENCES paquete(id_paquete),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario BIGINT REFERENCES usuario(id_usuario),
    observaciones TEXT
);

CREATE INDEX idx_historial_paquete ON historial_estado_paquete(id_paquete);
CREATE INDEX idx_historial_fecha ON historial_estado_paquete(fecha_cambio);
```

#### Tabla: `mensaje_contacto`

```sql
CREATE TABLE mensaje_contacto (
    id_mensaje BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_lectura TIMESTAMP
);
```

---

### Índices y Optimizaciones

**Índices Recomendados:**
- `codigo_barras.codigo` (único, búsqueda frecuente)
- `codigo_barras.estado` (filtrado por estado)
- `paquete.id_codigo_barras` (join frecuente)
- `paquete.estado` (filtrado por estado)
- `paquete.fecha_creacion` (ordenamiento)
- `paquete.destinatario_nombre` (búsqueda)

**Optimizaciones:**
- Particionamiento por fecha (si volumen alto)
- Archivo de datos históricos (paquetes antiguos)
- Caché de consultas frecuentes (Redis opcional)

---

## APIs y Integraciones

### Endpoints REST Principales

#### Autenticación

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

#### Códigos de Barras

```
GET    /api/v1/codigos/{codigo}           # Consultar estado
GET    /api/v1/codigos/{codigo}/historial # Historial de uso
GET    /api/v1/codigos?estado={estado}    # Listar por estado
```

#### Paquetes

```
GET    /api/v1/paquetes                   # Listar paquetes
GET    /api/v1/paquetes/{id}              # Obtener paquete
POST   /api/v1/paquetes                   # Crear paquete
PUT    /api/v1/paquetes/{id}              # Actualizar paquete
DELETE /api/v1/paquetes/{id}              # Eliminar paquete
GET    /api/v1/paquetes/buscar?q={query}  # Buscar paquetes
POST   /api/v1/paquetes/{id}/entregar     # Marcar como entregado
```

#### Etiquetas

```
GET /api/v1/paquetes/{id}/etiqueta/pdf    # Generar PDF
GET /api/v1/paquetes/{id}/etiqueta/zpl    # Generar ZPL
```

#### Contacto

```
POST /api/v1/contacto                     # Enviar mensaje
GET  /api/v1/contacto                     # Listar mensajes (admin)
```

---

### Integraciones con Hardware

#### Escáner USB/Bluetooth

**Implementación:**
- El escáner emula un teclado (HID)
- El código escaneado se ingresa automáticamente en el campo activo
- JavaScript captura el evento `input` o `keydown`
- Validación del formato del código

**Código de Ejemplo (React):**

```typescript
useEffect(() => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleInput = (e: KeyboardEvent) => {
    if (e.target === inputRef.current) {
      const codigo = inputRef.current.value;
      if (codigo.length >= 8) { // Longitud mínima
        consultarCodigo(codigo);
      }
    }
  };
  
  inputRef.current?.addEventListener('keydown', handleInput);
  return () => {
    inputRef.current?.removeEventListener('keydown', handleInput);
  };
}, []);
```

#### Cámara del Dispositivo

**Implementación:**
- Usar MediaDevices API del navegador
- Librería ZXing-js o QuaggaJS para decodificación
- Mostrar video stream en pantalla
- Detectar y decodificar códigos automáticamente

**Código de Ejemplo:**

```typescript
import { BrowserMultiFormatReader } from '@zxing/library';

const codeReader = new BrowserMultiFormatReader();
const videoInputDevices = await codeReader.listVideoInputDevices();

codeReader.decodeFromVideoDevice(
  videoInputDevices[0].deviceId,
  'video',
  (result) => {
    if (result) {
      consultarCodigo(result.getText());
    }
  }
);
```

#### Impresoras

**PDF:**
- Generar PDF en backend o frontend
- Usar `window.print()` del navegador
- O enviar PDF directamente a impresora (requiere configuración)

**ZPL:**
- Generar código ZPL en backend
- Enviar directamente a impresora Zebra vía red
- O descargar archivo .zpl para impresión manual

**Código de Ejemplo (ZPL):**

```java
// Backend Java
@GetMapping("/paquetes/{id}/etiqueta/zpl")
public ResponseEntity<String> generarZPL(@PathVariable Long id) {
    Paquete paquete = paqueteService.findById(id);
    String zpl = zplService.generarEtiqueta(paquete);
    return ResponseEntity.ok()
        .header("Content-Type", "application/zpl")
        .body(zpl);
}
```

---

## Seguridad

### Autenticación y Autorización

- **JWT (JSON Web Tokens):** Para autenticación stateless
- **Spring Security:** Para protección de endpoints
- **RBAC (Role-Based Access Control):** Para control granular
- **HTTPS:** Obligatorio en producción
- **Validación de entrada:** En frontend y backend
- **Rate limiting:** Para prevenir abusos

### Protección de Datos

- **Encriptación de contraseñas:** BCrypt o Argon2
- **Encriptación en tránsito:** TLS 1.2+
- **Encriptación en reposo:** Opcional para datos sensibles
- **Backup regular:** Base de datos y archivos
- **Logs de auditoría:** Todas las operaciones críticas

---

## Rendimiento

### Objetivos de Rendimiento

- **Consulta de código:** < 500ms
- **Guardado de paquete:** < 1 segundo
- **Generación de etiqueta PDF:** < 2 segundos
- **Generación de etiqueta ZPL:** < 1 segundo
- **Carga de lista de paquetes:** < 2 segundos (paginada)

### Optimizaciones

- **Caché:** Consultas frecuentes (Redis opcional)
- **Índices de BD:** En campos de búsqueda frecuente
- **Paginación:** Listas grandes
- **Lazy loading:** Cargar datos bajo demanda
- **CDN:** Para assets estáticos (opcional)

---

## Consideraciones Adicionales

### Escalabilidad

- **Base de datos:** Preparada para particionamiento
- **Backend:** Stateless, permite múltiples instancias
- **Frontend:** Puede servir desde CDN
- **Load balancing:** Posible con múltiples instancias

### Mantenimiento

- **Logs:** Centralizados y rotativos
- **Monitoreo:** Health checks
- **Backups:** Automáticos y regulares
- **Actualizaciones:** Proceso documentado

---

## Resumen de Tecnologías

### Backend
- Java 17+
- Spring Boot 3.x
- PostgreSQL 12+
- JWT
- Apache POI / iText
- ZPL Builder

### Frontend
- React 18+
- TypeScript 5+
- ZXing-js / QuaggaJS
- jsPDF
- Tailwind CSS

### Hardware
- Escáner USB/Bluetooth (HID)
- Impresoras estándar (PDF)
- Impresoras Zebra (ZPL)

---

## Documentos Relacionados

- [ESTIMACION_SISTEMA_SIMPLIFICADO.md](ESTIMACION_SISTEMA_SIMPLIFICADO.md) - Estimación de precios
- [HISTORIAS_USUARIO_SIMPLIFICADO.md](HISTORIAS_USUARIO_SIMPLIFICADO.md) - Historias de usuario
