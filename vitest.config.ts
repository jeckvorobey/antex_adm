import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      src: r('./src'),
      '@': r('./src'),
      '@components': r('./src/components'),
      '@stores': r('./src/stores'),
      '@pages': r('./src/pages'),
      '@layouts': r('./src/layouts'),
      '@boot': r('./src/boot'),
      '@composables': r('./src/composables'),
      '@utils': r('./src/utils'),
      '@assets': r('./src/assets'),
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        jsx: 'preserve',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/unit/setup.ts'],
  },
});
