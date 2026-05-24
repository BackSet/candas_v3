import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function injectAppUrlPlugin(appUrl: string): Plugin {
  const normalized = appUrl.replace(/\/$/, '')
  return {
    name: 'candas-inject-app-url',
    transformIndexHtml(html) {
      return html.replaceAll('%VITE_APP_URL%', normalized)
    },
    closeBundle() {
      if (!normalized) return
      const dist = path.resolve(__dirname, 'dist')
      for (const file of ['robots.txt', 'sitemap.xml'] as const) {
        const src = path.resolve(__dirname, 'public', file)
        if (!fs.existsSync(src)) continue
        const content = fs.readFileSync(src, 'utf-8').replaceAll('%VITE_APP_URL%', normalized)
        fs.writeFileSync(path.join(dist, file), content)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isLanMode = env.VITE_NETWORK_MODE === 'lan'
  const appUrl = env.VITE_APP_URL ?? ''

  return {
    plugins: [react(), injectAppUrlPlugin(appUrl)],
    server: {
      // Solo `VITE_NETWORK_MODE=lan` expone el dev server en la LAN (0.0.0.0).
      host: isLanMode ? true : undefined,
      port: Number(env.VITE_PORT ?? 5173),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
