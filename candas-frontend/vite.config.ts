import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
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
    plugins: [react(), injectAppUrlPlugin(appUrl)],
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
  }
})
