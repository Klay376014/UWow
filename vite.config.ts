import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  build: {
    // The oversized chunk is the lazily loaded mock backend (faker locale data); it disappears once a real API replaces MSW.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'happy-dom',
  },
})
