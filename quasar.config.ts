import { defineConfig } from '#q-app/wrappers';
import { fileURLToPath } from 'node:url';

export default defineConfig((/* ctx */) => {
  return {
    boot: ['axios', 'init'],
    css: ['app.scss'],
    extras: ['roboto-font', 'fontawesome-v6', 'mdi-v7', 'material-icons'],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      typescript: {
        strict: true,
        vueShim: true,
      },
      extendViteConf(viteConf) {
        viteConf.resolve ??= {};
        viteConf.resolve.alias ??= {};
        Object.assign(viteConf.resolve.alias as Record<string, string>, {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
          '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
          '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
          '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
          '@boot': fileURLToPath(new URL('./src/boot', import.meta.url)),
          '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
          '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
          '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        });
      },
      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            // Отключено временно
            // vueTsc: true,
          },
          { server: false },
        ],
      ],
    },
    devServer: {
      host: '127.0.0.1',
      port: 9000,
      open: false,
    },
    framework: {
      config: {},
      plugins: ['Dark', 'Notify', 'Loading', 'Dialog', 'LocalStorage'],
    },
    animations: [],
    ssr: {
      pwa: false,
      prodPort: 3000,
    },
    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },
  };
});
