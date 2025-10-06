# 🎌 AnimeSwipe

Aplicación Next.js para descubrir anime con sistema de swipe tipo Tinder.

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📦 Tecnologías

- **Framework**: Next.js 15.5 (App Router + Turbopack)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS v4
- **Iconos**: Lucide React
- **Linting**: ESLint 9 (Flat Config)
- **Formateo**: Prettier 3
- **Runtime**: Node.js >= 20

---

## 🛠️ Comandos disponibles

### Desarrollo

```bash
npm run dev          # Servidor de desarrollo con Turbopack
npm run dev:clean    # Limpiar cache + iniciar dev server
```

### Build y Preview

```bash
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run preview      # Build + Start
```

### Calidad de código

```bash
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Arreglar problemas automáticamente

npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato

npm run code:check   # Ejecutar: type-check + lint + format:check
npm run code:fix     # Ejecutar: lint:fix + format
```

### Utilidades

```bash
npm run clean        # Limpiar .next y cache
npm run clean:all    # Limpiar .next y node_modules
```

---

## 📁 Estructura del proyecto

```
anime-swipe/
├── src/
│   ├── app/              # App Router (páginas, layouts)
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Utilidades y constantes
├── public/               # Assets estáticos
├── eslint.config.js      # Configuración ESLint
├── prettier.config.js    # Configuración Prettier
├── postcss.config.mjs    # Configuración PostCSS
├── tsconfig.json         # Configuración TypeScript
└── next.config.ts        # Configuración Next.js
```

---

## 🎨 Estilo de código

Este proyecto usa:

- **ESLint** - Reglas de código y mejores prácticas
- **Prettier** - Formato consistente
- **TypeScript** - Modo estricto habilitado

### Antes de hacer commit

```bash
npm run code:check
```

### Arreglar problemas automáticamente

```bash
npm run code:fix
```

---

## 📝 Convenciones

- Usa **npm** como gestor de paquetes (no pnpm/yarn)
- Los imports se ordenan automáticamente
- Los imports de tipos usan `import type { ... }`
- Turbopack habilitado para builds rápidos
- Node.js >= 20 requerido

---

## 🔗 Deploy

La forma más fácil de deployar es usando [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📄 Licencia

MIT
