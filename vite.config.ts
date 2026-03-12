import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // user_server routes (port 8088)
      '/api/v1/login': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/v1/user': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/v1/token': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/v1/jwt': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/v1/organization': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/v1/organizations': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // aigateway (OpenAI-compatible API)
      '/v1': {
        target: 'http://localhost:8094',
        changeOrigin: true,
      },
      // admin routes go to user server
      '/api/v1/admin': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // public routes (no auth) go to user server
      '/api/v1/public': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // casdoor
      '/casdoor': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/casdoor/, ''),
      },
      // main server (catch-all)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
