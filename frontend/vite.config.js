import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // host: true → listen on 0.0.0.0 so the app is reachable from other
    // devices on the LAN (e.g. http://<your-ip>:5173). The /api proxy runs
    // server-side to the backend on this same host, so no CORS change needed.
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
