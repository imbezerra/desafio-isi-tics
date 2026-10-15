import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
    env: { VITE_API_URL: 'http://localhost:3000' },
  },
});
