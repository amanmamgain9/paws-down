import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const server = process.env.PAWS_DOWN_URL ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  // Polling keeps reloads reliable on mounted drives, where file-change events can be missed.
  server: { proxy: { '/app': server, '/demo': server }, watch: { usePolling: true, interval: 300 } },
});
