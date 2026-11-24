# SmartLife

Unified PWA: **Lists** and **Finances** in one app (`/spisak/` on GitHub Pages).

## Run

```bash
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (Spisak project)
npm install
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

## Supabase (module tables)

In the **Spisak** Supabase project → SQL Editor, run:

1. [`supabase/schema-modules.sql`](supabase/schema-modules.sql) — finances tables  
2. [`supabase/schema-lists-position.sql`](supabase/schema-lists-position.sql) — list reorder (`position`)

Leaves `settings` alone.

## Features

- Google OAuth (shared)
- Module drawer: Lists / Finances
- i18n: EN / ES / FR / RU / SR
- Light / dark theme
- Offline-tolerant writes for the finances queue
