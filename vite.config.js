import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL cho GitHub Pages - thay 'phong-thuy-3d' bằng tên repo của bạn
  base: '/phong-thuy-3d/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
