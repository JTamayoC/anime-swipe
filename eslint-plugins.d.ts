// Type declarations for ESLint plugins without official TypeScript types
// This file suppresses TypeScript warnings for plugins that don't ship with .d.ts files
// Frontend/Panel specific (React 19 + Vite 7 + TailwindCSS 4)

declare module 'eslint-plugin-react-hooks' {
  import type { ESLint } from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-react-refresh' {
  import type { ESLint } from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-plugin-tailwindcss' {
  import type { ESLint } from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module 'eslint-config-prettier/flat' {
  import type { Linter } from 'eslint';

  const config: Linter.Config;
  export default config;
}
