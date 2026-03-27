import { defineConfig } from '#q-app/wrappers';

export default defineConfig((/* ctx */) => {
  return {
    boot: ['axios', 'init'],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons', 'mdi-v7'],
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      typescript: { strict: true },
    },
    devServer: {
      port: 9000,
    },
    framework: {
      config: {},
      plugins: ['Notify', 'Loading', 'Dialog', 'LocalStorage'],
    },
  };
});
