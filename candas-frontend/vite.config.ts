/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

const DEFAULT_DEV_PORT = 5173

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '')
}

function resolveAppUrl(env: Record<string, string>, isProd: boolean): string {
  const explicitUrl = env.VITE_APP_URL?.trim()
  if (explicitUrl) return normalizeUrl(explicitUrl)

  if (isProd) return ''

  const protocol = env.VITE_DEV_PROTOCOL?.trim() || 'http'
  const host = env.VITE_DEV_HOST?.trim() || 'localhost'
  const port = Number(env.VITE_PORT ?? DEFAULT_DEV_PORT)
  return `${protocol}://${host}:${port}`
}

function resolveAllowedHosts(env: Record<string, string>): string[] {
  return (env.VITE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}

function injectAppUrlPlugin(appUrl: string): Plugin {
  return {
    name: 'candas-inject-app-url',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html.replaceAll('%APP_URL%', appUrl)
    },
    closeBundle() {
      if (!appUrl) return
      const dist = path.resolve(__dirname, 'dist')
      for (const file of ['robots.txt', 'sitemap.xml'] as const) {
        const src = path.resolve(__dirname, 'public', file)
        if (!fs.existsSync(src)) continue
        const content = fs.readFileSync(src, 'utf-8').replaceAll('%APP_URL%', appUrl)
        fs.writeFileSync(path.join(dist, file), content)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isLanMode = env.VITE_NETWORK_MODE === 'lan'
  const appUrl = resolveAppUrl(env, mode === 'production')

  return {
    plugins: [
      react(),
      injectAppUrlPlugin(appUrl),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        // Assets estáticos que se precachean además del bundle generado.
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-icon.svg', 'pwa-maskable.svg'],
        manifest: {
          name: 'Candas — Gestión logística',
          short_name: 'Candas',
          description:
            'Sistema de gestión logística y operativa: recepción, despachos, ensacado, manifiestos y seguimiento de paquetes.',
          lang: 'es',
          dir: 'ltr',
          id: '/',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#2563eb',
          background_color: '#0b1623',
          categories: ['business', 'productivity', 'logistics'],
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // App shell: precache de JS/CSS/HTML e iconos para arranque y fallback offline.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          // SPA: las navegaciones offline caen al app shell cacheado.
          navigateFallback: '/index.html',
          // Nunca interceptar la API logística/transaccional como navegación.
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          // MVP: NO se cachea la API. Solo fuentes estáticas (Google Fonts) para el shell.
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        // En desarrollo no se habilita el SW para evitar caché agresiva durante el dev.
        devOptions: { enabled: false },
      }),
    ],
    server: {
      // Solo `VITE_NETWORK_MODE=lan` expone el dev server en la LAN (0.0.0.0).
      host: isLanMode ? true : undefined,
      port: Number(env.VITE_PORT ?? DEFAULT_DEV_PORT),
      allowedHosts: resolveAllowedHosts(env),
    },
    preview: {
      allowedHosts: resolveAllowedHosts(env),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
            if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return 'tanstack'
            if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) return 'radix-ui'
            if (/[\\/]node_modules[\\/](xlsx)[\\/]/.test(id)) return 'xlsx'
            if (/[\\/]node_modules[\\/]jspdf[\\/]/.test(id)) return 'jspdf'
            if (/[\\/]node_modules[\\/]html2canvas[\\/]/.test(id)) return 'html2canvas'
            if (/[\\/]node_modules[\\/]dompurify[\\/]/.test(id)) return 'dompurify'
            if (/[\\/]node_modules[\\/](zod|@hookform|react-hook-form)[\\/]/.test(id)) return 'forms'
            if (/[\\/]node_modules[\\/](lucide-react)[\\/]/.test(id)) return 'icons'
            return undefined
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
