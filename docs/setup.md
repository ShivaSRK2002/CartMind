# CartMind AI — Setup Guide

## Stack

- Frontend: Next.js 14 (App Router), React, TypeScript, Tailwind CSS — `apps/web`
- Backend: Node.js + Express, TypeScript — `apps/api`
- Database: PostgreSQL
- Event tracking: RudderStack (JS SDK client-side, Node SDK server-side)
- Auth: JWT
- Shared types: `packages/shared-types`

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (local install or free-tier hosted instance)

## Install

```bash
npm install
```

This installs dependencies for all workspaces (`apps/web`, `apps/api`, `packages/shared-types`).

## Environment variables

Copy the example env files and fill in local values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

## Running locally

```bash
npm run dev:web   # Next.js dev server on http://localhost:3000
npm run dev:api   # Express API on http://localhost:4000
```

## Database

Migrations live in `db/migrations`, seed scripts in `db/seed`. (Populated in a later phase.)

## The 9 behavioral events

Canonical event names (never rename): `product_viewed`, `add_to_cart`, `remove_from_cart`,
`checkout_started`, `payment_success`, `wishlist_add`, `coupon_applied`, `search_query`,
`checkout_abandoned`. Types live in `packages/shared-types/src/events.ts`.
