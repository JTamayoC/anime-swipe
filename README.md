# 🎌 AnimeSwipe

Descubre anime con swipe tipo Tinder.

## Stack

- Next.js 15 + React 19 + TypeScript 5
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- ESLint 9 + Prettier 3

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo

npm run build        # Build de producción
npm run start        # Servidor de producción

npm run type-check   # Verificar tipos
npm run lint         # Linter
npm run format       # Formatear código
```

## Estructura

```
src/
├── app/              # Páginas y layouts
├── types/            # TypeScript types
├── utils/
│   ├── supabase/     # Supabase clients (client, server, middleware)
│   └── constants.ts  # Constantes

supabase/
└── schema.sql        # Database schema
```

## Setup Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar `supabase/schema.sql` en SQL Editor
3. Crear `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-publishable-key
```

Ver **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** para ejemplos de uso.

## Licencia

MIT
