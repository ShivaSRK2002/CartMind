# CartMind AI

A behavioral-analytics eCommerce demo platform: tracks the shopper journey
(views, cart actions, checkout, search) through nine canonical events and
surfaces that data for analysis.

## Prerequisites

- Node.js 20 (see `.nvmrc` — run `nvm use` if you use nvm)
- npm 10+
- Docker Desktop (or Docker Engine + Compose plugin) for the local PostgreSQL container

## Getting started

Install dependencies for all workspaces:

```bash
npm install
```

Copy the environment file templates:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp db/.env.example db/.env
```

### Start PostgreSQL

```bash
docker compose -f db/docker-compose.yml up -d
```

This starts Postgres 16 on `localhost:5432` (user/password/db: `cartmind`/`cartmind`/`cartmind`),
matching the default `DATABASE_URL` in `apps/api/.env.example`.

To stop it: `docker compose -f db/docker-compose.yml down` (add `-v` to also
drop the data volume).

### Run migrations

```bash
npm run db:migrate
```

Applies any `.sql` files in `db/migrations` that haven't run yet, via
[node-pg-migrate](https://github.com/salsita/node-pg-migrate) (tracked in its
`pgmigrations` table). Requires `DATABASE_URL` to be set (via `apps/api/.env`).
To roll back the most recent migration: `npm run migrate:down --workspace=apps/api`.

### Seed demo data

```bash
npm run db:seed
```

Inserts 5 demo users (`admin@cartmind.ai` + 4 customers, password `password123`
for all) and 30 demo products across 5 categories. Safe to re-run — it
truncates dependent tables first.

### Start the apps

Run web and API together:

```bash
npm run dev
```

Or individually:

```bash
npm run dev:web   # Next.js dev server on http://localhost:3000
npm run dev:api   # Express API on http://localhost:4000
```

Health check: `GET http://localhost:4000/api/v1/health`

## Authentication

JWT-based, no paid Firebase tier. `apps/api` issues tokens on register/login;
`apps/web` stores them in an httpOnly cookie set by its own route handlers
(`app/api/auth/*`), so the raw token never reaches client-side JS.

- `JWT_SECRET` **must be the same value** in `apps/api/.env` and
  `apps/web/.env.local` — the API signs tokens, the web app's middleware and
  session helper verify them independently.
- Customer flows: `/register`, `/login`.
- Admin flow: `/admin/login` — rejects credentials for non-admin accounts.
  `middleware.ts` guards all `/admin/**` routes, redirecting to `/admin/login`
  if there's no valid admin session.
- Seeded accounts (after `npm run db:seed`): `admin@cartmind.ai` (admin) and
  `alice@example.com` / `bob@example.com` / `carol@example.com` /
  `dave@example.com` (customers), password `password123` for all.

## Folder structure

```
/apps
  /web             Next.js 14 storefront (App Router, TypeScript, Tailwind)
  /api             Express REST API (TypeScript, tsx for dev)
/packages
  /shared-types    Shared TS types (event payloads, DB models, API response envelope)
/db
  docker-compose.yml   Local PostgreSQL 16 container
  /migrations          SQL migration files (node-pg-migrate)
  /seed                Seed data (5 demo users, 30 demo products)
/docs                  Architecture diagrams, API docs, setup notes
```

## The 9 behavioral events

Canonical names (never rename): `product_viewed`, `add_to_cart`,
`remove_from_cart`, `checkout_started`, `payment_success`, `wishlist_add`,
`coupon_applied`, `search_query`, `checkout_abandoned`. Types live in
`packages/shared-types/src/events.ts`.
