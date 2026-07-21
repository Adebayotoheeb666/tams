# TBH-IMS — Tams Beauty Hub Inventory Management System

Phase 1 foundation for the TBH-IMS platform (see `TAMS_IMS_SDD_v2_NextJS_Turso.md`).

**Stack:** Next.js 14 · Turso (libSQL) · Drizzle ORM · Auth.js

## Phase 1 progress

### Week 1 (complete)
- [x] Next.js 14 App Router + Tailwind CSS + shadcn/ui components
- [x] Drizzle schema + Turso/libSQL + migrations
- [x] Auth.js credentials login with role-based middleware
- [x] Dashboard shell with mobile-first navigation
- [x] Seed script (owner user, chart of accounts, default categories)

### Weeks 2–4 (complete)
- [x] Product CRUD server actions + list, add, and edit screens
- [x] Category management with business unit filter (thrift / nails)
- [x] Stock adjustment with reason logging (`stock_movements` table)
- [x] Low-stock flagging in product list and dashboard

### Weeks 5–7 (complete)
- [x] POS screen — product selector, cart, payment method, discount
- [x] `createSale()` — atomic order + stock + journal entries
- [x] Digital receipt modal with WhatsApp share
- [x] Sales history with date filter and pagination
- [x] Sale detail / receipt view at `/sales/[id]`

### Week 8 (in progress)
- [x] CSV bulk stock import (`/inventory/import`)
- [x] Coming-soon pages for Appointments, Settings, and Ledger nav links
- [x] POS stock counts refresh after each sale
- [ ] End-to-end testing and go-live prep

## Getting started

```bash
cp .env.example .env
# Set AUTH_SECRET: openssl rand -base64 32

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with:

- **Email:** `owner@tamsbeautyhub.com`
- **Password:** `changeme123` (change via `SEED_OWNER_PASSWORD` before seeding)

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed owner, COA, categories |
| `npm run db:studio` | Open Drizzle Studio |

## Docker + local automation

To run the app and the local automation service together:

```bash
docker compose up --build
```

- The app is exposed at `http://localhost:3000`
- The automation service is exposed at `http://localhost:4000/health`
- Webhooks and business automation are handled locally inside this repo via the dedicated automation service
- Set `AUTOMATION_WEBHOOK_BASE_URL=http://automation:4000` and optionally `N8N_WEBHOOK_BASE_URL=http://automation:4000` for compatibility
- Social posts can now be scheduled through the automation service via `POST /api/social/posts` and processed automatically by the worker loop

## Turso (production)

1. Create databases at [turso.tech](https://turso.tech)
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel env vars
3. Set `AUTH_SECRET` and `AUTH_URL` for Auth.js
4. Deploy — migrations run via `postbuild` script

## Next up (Phase 1 Week 8)

- End-to-end testing of inventory and POS flows
- Go-live preparation (production Turso + Vercel)
