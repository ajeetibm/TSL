import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-legal-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const map: Record<string, string> = {
            '/privacy-policy':   path.resolve(__dirname, 'public/legal/privacy-policy.html'),
            '/popia-compliance': path.resolve(__dirname, 'public/legal/popia-compliance.html'),
          }
          const file = map[req.url?.split('?')[0] ?? '']
          if (file && fs.existsSync(file)) {
            res.setHeader('Content-Type', 'text/html')
            fs.createReadStream(file).pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
})
