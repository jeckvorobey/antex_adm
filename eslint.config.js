import js from '@eslint/js';

export default [
  {
    ignores: ['.quasar/**', 'dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
];
