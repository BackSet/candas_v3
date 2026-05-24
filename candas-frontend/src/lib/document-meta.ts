import { siteConfig } from '@/config/site'

export interface PageMeta {
  title?: string
  description?: string
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

/**
 * Actualiza título y metas para SPA (navegación interna).
 * Los bots de redes suelen leer el HTML inicial de index.html.
 */
export function applyPageMeta(meta?: PageMeta) {
  const title = meta?.title ? `${meta.title} · ${siteConfig.shortTitle}` : siteConfig.title
  const description = meta?.description ?? siteConfig.description

  document.title = title
  setMetaTag('name', 'description', description)
  setMetaTag('property', 'og:title', title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('name', 'twitter:title', title)
  setMetaTag('name', 'twitter:description', description)
}

export function applyDefaultDocumentMeta() {
  applyPageMeta()
}
