import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_REPO_NAME ?? '/',
  plugins: [react()],
  server: {
    host: true,
  },
  define: {
    global: {},
  },
  publicDir: 'static',
})
