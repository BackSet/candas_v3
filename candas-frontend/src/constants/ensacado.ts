/** Intervalos de polling para sincronización escáner ↔ vista móvil */
export const ENSACADO_POLL = {
  sessionMs: 2_000,
  despachoMs: 4_000,
} as const

export const ENSACADO_SCAN = {
  debounceMs: 400,
  minGuiaLength: 3,
  maxListItems: 50,
} as const
