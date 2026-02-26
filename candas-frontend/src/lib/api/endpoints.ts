// Endpoints del backend candas-backend

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },

  // Usuarios
  USUARIOS: {
    BASE: '/api/v1/usuarios',
    BY_ID: (id: number) => `/api/v1/usuarios/${id}`,
    SEARCH: '/api/v1/usuarios/search',
  },

  // Clientes
  CLIENTES: {
    BASE: '/api/v1/clientes',
    BY_ID: (id: number) => `/api/v1/clientes/${id}`,
    SEARCH: '/api/v1/clientes/search',
  },

  // Agencias
  AGENCIAS: {
    BASE: '/api/v1/agencias',
    BY_ID: (id: number) => `/api/v1/agencias/${id}`,
    SEARCH: '/api/v1/agencias/search',
  },

  // Puntos de Origen
  PUNTOS_ORIGEN: {
    BASE: '/api/v1/puntos-origen',
    BY_ID: (id: number) => `/api/v1/puntos-origen/${id}`,
    SEARCH: '/api/v1/puntos-origen/search',
  },

  // Paquetes
  PAQUETES: {
    BASE: '/api/v1/paquetes',
    BY_ID: (id: number) => `/api/v1/paquetes/${id}`,
  },

  // Lotes de Recepción
  LOTES_RECEPCION: {
    BASE: '/api/v1/lotes-recepcion',
    BY_ID: (id: number) => `/api/v1/lotes-recepcion/${id}`,
    SEARCH: '/api/v1/lotes-recepcion/search',
    ESPECIALES: '/api/v1/lotes-recepcion/especiales',
    ESPECIALES_SEARCH: '/api/v1/lotes-recepcion/especiales/search',
  },

  // Sacas
  SACAS: {
    BASE: '/api/v1/sacas',
    BY_ID: (id: number) => `/api/v1/sacas/${id}`,
    SEARCH: '/api/v1/sacas/search',
  },

  // Despachos
  DESPACHOS: {
    BASE: '/api/v1/despachos',
    BY_ID: (id: number) => `/api/v1/despachos/${id}`,
    SEARCH: '/api/v1/despachos/search',
    POR_PERIODO: '/api/v1/despachos/por-periodo',
    MARCAR_DESPACHADO_BATCH: '/api/v1/despachos/acciones/marcar-despachado',
  },

  // Sesión despacho masivo (Ver despacho en curso)
  DESPACHO_MASIVO: {
    BASE: '/api/v1/despacho-masivo',
    SESSION: '/api/v1/despacho-masivo/session',
  },

  // Atención de Paquetes
  ATENCION_PAQUETES: {
    BASE: '/api/v1/atenciones',
    BY_ID: (id: number) => `/api/v1/atenciones/${id}`,
  },

  // Roles
  ROLES: {
    BASE: '/api/v1/roles',
    BY_ID: (id: number) => `/api/v1/roles/${id}`,
    SEARCH: '/api/v1/roles/search',
  },

  // Permisos
  PERMISOS: {
    BASE: '/api/v1/permisos',
    BY_ID: (id: number) => `/api/v1/permisos/${id}`,
    SEARCH: '/api/v1/permisos/search',
  },

  // Distribuidores
  DISTRIBUIDORES: {
    BASE: '/api/v1/distribuidores',
    BY_ID: (id: number) => `/api/v1/distribuidores/${id}`,
    SEARCH: '/api/v1/distribuidores/search',
  },

  // Manifiestos Consolidados
  MANIFESTOS_CONSOLIDADOS: {
    BASE: '/api/v1/manifiestos-consolidados',
    BY_ID: (id: number) => `/api/v1/manifiestos-consolidados/${id}`,
    BY_AGENCIA: (idAgencia: number) => `/api/v1/manifiestos-consolidados/agencia/${idAgencia}`,
    SEARCH: '/api/v1/manifiestos-consolidados/search',
  },

  // Destinatarios Directos
  DESTINATARIOS_DIRECTOS: {
    BASE: '/api/v1/destinatarios-directos',
    BY_ID: (id: number) => `/api/v1/destinatarios-directos/${id}`,
    SEARCH: '/api/v1/destinatarios-directos/search',
  },

  // Ensacado
  ENSACADO: {
    BASE: '/api/v1/ensacado',
    BUSCAR_PAQUETE: (numeroGuia: string) => `/api/v1/ensacado/buscar-paquete/${numeroGuia}`,
    MARCAR_ENSACADO: (idPaquete: number) => `/api/v1/ensacado/marcar-ensacado/${idPaquete}`,
    DESPACHO_INFO: (idDespacho: number) => `/api/v1/ensacado/despacho/${idDespacho}/info`,
    SESSION: '/api/v1/ensacado/session',
    SESSION_ULTIMA_BUSQUEDA: '/api/v1/ensacado/session/ultima-busqueda',
  },

  // Listas etiquetadas (GEO, MIA) - flujo basado en Paquete
  LISTAS_ETIQUETADAS: {
    BASE: '/api/v1/paquetes/listas-etiquetadas',
    BATCH: '/api/v1/paquetes/listas-etiquetadas/batch',
    CONSULTA: '/api/v1/paquetes/listas-etiquetadas/consulta',
    BY_NUMERO_GUIA: (numeroGuia: string) => `/api/v1/paquetes/listas-etiquetadas/guia/${encodeURIComponent(numeroGuia)}`,
    BY_ETIQUETA: (etiqueta: string) => `/api/v1/paquetes/listas-etiquetadas/etiqueta/${encodeURIComponent(etiqueta)}`,
    ETIQUETAS: '/api/v1/paquetes/listas-etiquetadas/etiquetas',
    MARCAR_RECEPTADO: '/api/v1/paquetes/listas-etiquetadas/marcar-receptado',
    ELEGIR_ETIQUETA: '/api/v1/paquetes/listas-etiquetadas/elegir-etiqueta',
    GUIA_EN_VARIAS_LISTAS: '/api/v1/paquetes/listas-etiquetadas/guias-en-varias-listas',
    HISTORIAL_RECEPTADOS: '/api/v1/paquetes/listas-etiquetadas/historial-receptados',
    EXPORT: '/api/v1/paquetes/listas-etiquetadas/export',
  },

} as const
