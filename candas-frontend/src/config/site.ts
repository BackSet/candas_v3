/**
 * Metadatos del sitio (SEO, Open Graph, compartir enlaces).
 * URL pública: definir VITE_APP_URL en producción (sin barra final).
 */
const appUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const siteConfig = {
  name: 'Candas',
  title: 'Candas — Gestión logística de paquetes',
  shortTitle: 'Candas',
  description:
    'Sistema de gestión logística y operativa: recepción, despachos, ensacado, manifiestos, atención de paquetes y seguimiento en bodega.',
  tagline: 'Gestión logística y operativa en un solo lugar',
  keywords: [
    'candas',
    'logística',
    'paquetes',
    'despachos',
    'ensacado',
    'manifiestos',
    'bodega',
    'courier',
  ],
  locale: 'es_EC',
  themeColor: '#2563eb',
  /** URL absoluta del sitio (vacía en dev si no se define VITE_APP_URL). */
  url: appUrl,
  ogImagePath: '/og-image.svg',
  twitterHandle: '',
} as const

export function absoluteUrl(path: string): string {
  const base = siteConfig.url || (typeof window !== 'undefined' ? window.location.origin : '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}

export function getOgImageUrl(): string {
  return absoluteUrl(siteConfig.ogImagePath)
}
