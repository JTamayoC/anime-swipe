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
// IMPORT PLUGIN - Enhanced rules for better code organization
// ============================================================================
config.push({
  plugins: { import: pluginImport },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      typescript: { alwaysTryTypes: true },
    },
  },
  rules: {
    // Core import rules
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/export': 'error',

    // Style rules
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/newline-after-import': 'warn',
    'import/no-anonymous-default-export': 'warn',

    // Helpful rules
    'import/no-unused-modules': 'warn',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'warn',

    // Import ordering - opinionated but helpful
    'import/order': [
      'warn',
      {
        groups: [
          'builtin', // Node built-ins
          'external', // npm packages
          'internal', // Internal imports
          ['parent', 'sibling'], // Relative imports
          'index', // Index files
          'type', // Type-only imports
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
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

    // Enhanced no-unused-vars for JavaScript
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // Code quality rules
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
    eqeqeq: ['error', 'always', { null: 'ignore' }],

    // Import related - handled by import plugin
    'no-duplicate-imports': 'off', // import plugin handles this better
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
      project: './tsconfig.json',
    },
    globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
  },
  plugins: { '@typescript-eslint': typescriptPlugin, 'react-hooks': pluginReactHooks },
  rules: {
    ...pluginReactHooks.configs.recommended.rules,

    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',

    // Disable base rule in favor of TypeScript version
    'no-unused-vars': 'off',

    // Enhanced TypeScript unused vars
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // Additional useful TypeScript rules
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',

    // Import type consistency
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
