import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isLanMode = env.VITE_NETWORK_MODE === 'lan'

  return {
    plugins: [react()],
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
