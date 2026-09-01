import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'dist-worker/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'shared/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    files: ['worker/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.worker,
    },
  },
  {
    files: ['scripts/**/*.mjs', 'rag/runtime/**/*.mjs', '*.config.mjs', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.nodeBuiltin,
    },
  },
);
