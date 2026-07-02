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
matching the default `DATABASE_URL` in `apps/api/.env.example`. No schema is
applied yet — migrations land in a later phase.

To stop it: `docker compose -f db/docker-compose.yml down` (add `-v` to also
drop the data volume).

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

## Folder structure

```
/apps
  /web             Next.js 14 storefront (App Router, TypeScript, Tailwind)
  /api             Express REST API (TypeScript, tsx for dev)
/packages
  /shared-types    Shared TS types (event payloads, DB models, API response envelope)
/db
  docker-compose.yml   Local PostgreSQL 16 container
  /migrations          SQL migration files (empty for now)
  /seed                Seed scripts for demo data (empty for now)
/docs                  Architecture diagrams, API docs, setup notes
```

## The 9 behavioral events

Canonical names (never rename): `product_viewed`, `add_to_cart`,
`remove_from_cart`, `checkout_started`, `payment_success`, `wishlist_add`,
`coupon_applied`, `search_query`, `checkout_abandoned`. Types live in
`packages/shared-types/src/events.ts`.
