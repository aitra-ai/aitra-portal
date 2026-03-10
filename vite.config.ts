import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.100.18.37:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/casdoor': {
        target: 'http://10.100.18.37:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/casdoor/, ''),
      },
    },
  },
})
