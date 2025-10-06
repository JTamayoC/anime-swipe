// @ts-nocheck
// ESLint Flat Config - Next.js 15 + React 19 + TypeScript
import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const config = [];

// ============================================================================
// BASE CONFIGURATION
// ============================================================================
config.push(js.configs.recommended);

// ============================================================================
// REACT PLUGIN - Core React rules
// ============================================================================
config.push({
  plugins: { react: pluginReact },
  settings: { react: { version: 'detect' } },
  rules: {
    ...pluginReact.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-no-target-blank': ['error', { allowReferrer: true }],
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-children-prop': 'error',
  },
});

// ============================================================================
// JSX ACCESSIBILITY
// ============================================================================
config.push({
  plugins: { 'jsx-a11y': pluginJsxA11y },
  rules: {
    ...pluginJsxA11y.configs.recommended.rules,
    'jsx-a11y/anchor-is-valid': ['warn', { components: ['Link'], specialLink: ['to', 'href'] }],
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
  },
});

// ============================================================================
// IMPORT PLUGIN
// ============================================================================
config.push({
  plugins: { import: pluginImport },
  settings: {
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
  },
  rules: {
    'import/no-unresolved': 'off',
    'import/named': 'error',
    'import/default': 'error',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/newline-after-import': 'warn',
  },
});

// ============================================================================
// JAVASCRIPT/JSX FILES
// ============================================================================
config.push({
  files: ['**/*.{js,jsx,mjs}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
    globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
  },
  plugins: { 'react-hooks': pluginReactHooks },
  rules: {
    ...pluginReactHooks.configs.recommended.rules,
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
});

// ============================================================================
// TYPESCRIPT FILES
// ============================================================================
config.push({
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
  },
  plugins: { '@typescript-eslint': typescriptPlugin, 'react-hooks': pluginReactHooks },
  rules: {
    ...pluginReactHooks.configs.recommended.rules,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
  },
});

// ============================================================================
// CONFIG FILES
// ============================================================================
config.push({
  files: ['*.config.{js,mjs,ts}', 'eslint.config.ts', 'prettier.config.ts'],
  rules: { 'import/no-anonymous-default-export': 'off', 'no-console': 'off' },
});

// ============================================================================
// PRETTIER
// ============================================================================
config.push(prettierConfig);

// ============================================================================
// IGNORES
// ============================================================================
config.push({
  ignores: [
    '.next/**',
    'out/**',
    'dist/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    '*.min.js',
  ],
});

export default config;
