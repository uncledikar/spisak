# Spisak

PWA for trip/shopping lists. Data and auth via Supabase (Google sign-in).

## Run

```bash
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

## Features

- Google OAuth (Supabase Auth)
- Lists / items / trash / copy — stored in Supabase per user
- i18n: EN / ES / FR / RU / SR
- Light / dark theme
