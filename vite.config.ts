import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function fontPreloadPlugin(): Plugin {
  return {
    name: 'font-preload-injector',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html

      let headingFontUrl = ''
      let bodyFontUrl = ''

      for (const [fileName] of Object.entries(ctx.bundle)) {
        if (fileName.includes('bricolage-grotesque-latin-700-normal') && fileName.endsWith('.woff2')) {
          headingFontUrl = '/' + fileName
        }
        if (fileName.includes('hanken-grotesk-latin-400-normal') && fileName.endsWith('.woff2')) {
          bodyFontUrl = '/' + fileName
        }
      }

      const preloads: string[] = []
      if (headingFontUrl) {
        preloads.push(`<link rel="preload" href="${headingFontUrl}" as="font" type="font/woff2" crossorigin="anonymous" />`)
      }
      if (bodyFontUrl) {
        preloads.push(`<link rel="preload" href="${bodyFontUrl}" as="font" type="font/woff2" crossorigin="anonymous" />`)
      }

      if (preloads.length > 0) {
        return html.replace('<!-- FONT_PRELOADS -->', preloads.join('\n    '))
      }
      return html
    },
  }
}

// Dev-only plugin to capture and save hero object snapshots to public/hero/
function devSnapshotSaverPlugin(): Plugin {
  return {
    name: 'dev-snapshot-saver',
    apply: 'serve', // Strictly dev-only!
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/__save_hero_snapshot') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { filename, data } = JSON.parse(body)
              const base64Data = data.replace(/^data:image\/\w+;base64,/, '')
              const buffer = Buffer.from(base64Data, 'base64')
              const outDir = path.resolve(__dirname, 'public/hero')
              if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true })
              }
              const filePath = path.join(outDir, filename)
              fs.writeFileSync(filePath, buffer)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, filename, size: buffer.length }))
            } catch (err: unknown) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fontPreloadPlugin(), devSnapshotSaverPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/motion')) {
            return 'vendor-motion'
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
