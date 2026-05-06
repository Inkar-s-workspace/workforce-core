# AMC Workforce

Workforce management system for Accra Medical Centre. Tracks attendance, duty rosters, overtime, and credit balances for permanent staff and locums, with ZK BioTime 9.0 fingerprint integration.

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** — Supabase (Postgres, Auth, Edge Functions)
- **Hardware** — ZK BioTime 9.0 attendance terminals
- **Hosting** — TBD

## Getting started

Requires Node.js and npm. If you don't have them, install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
# Install dependencies
npm install

# Start the dev server (runs on http://localhost:8080)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project structure

```
src/
├── components/      Reusable UI components (shadcn/ui + custom)
├── pages/           Top-level routes
├── hooks/           Custom React hooks
├── data/            Mock data (used until BioTime sync is live)
├── integrations/
│   └── supabase/    Supabase client + generated types
├── types/           Shared TypeScript types
└── lib/             Utilities

supabase/
├── functions/       Edge Functions (sync-biotime, quick-ask)
└── migrations/      SQL migrations
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The BioTime sync function uses additional secrets configured in the Supabase dashboard:
- `BIOTIME_URL`
- `BIOTIME_USERNAME`
- `BIOTIME_PASSWORD`

## Brand

Colours and fonts follow the AMC brand book.

| Use | Colour | Hex |
|---|---|---|
| Primary brand, headings, key UI | Greyish blue | `#324157` |
| Accent, highlights, locum badges | Dark yellow | `#DCAA05` |
| Warnings, missed punches, deductions | Vivid red | `#BC0705` |
| Page background | Light blue | `#F5F6F8` |

Typography: Poppins for UI, Times New Roman for editorial moments (welcome line, big numbers).

## Roles

The app supports three roles, scoped via Supabase RLS:

- **HR / Admin** — full access across all departments
- **Department Head** — sees only their team
- **Reception** — limited view for issue logging

## License

Internal — Accra Medical Centre.