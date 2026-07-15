# Deployment Guide

## Architecture

```
Velora Storefront (Vercel)  ──►  Express API (Render)  ──►  PostgreSQL (Render)
Orbit Admin (Vercel)       ──►       ▲
                                      │
                               RudderStack + Event Ingestion
```

## Local development

```bash
npm install
docker compose -f db/docker-compose.yml up -d
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run db:migrate && npm run db:seed
npm run dev
```

| App | URL |
|-----|-----|
| Velora storefront | http://localhost:3000 |
| Orbit admin | http://localhost:3001 |
| API + Swagger | http://localhost:4000/api/docs |

## CI (GitHub Actions)

On every push/PR, `.github/workflows/ci.yml` runs:

1. `npm ci`
2. Build shared types
3. Migrate + seed Postgres
4. Build all apps
5. API integration tests (health, auth, events, pipeline E2E)
6. Lint

## Deploy API to Render

1. Connect this repo to [Render](https://render.com)
2. Use the `render.yaml` blueprint (creates API + Postgres)
3. Set `GEMINI_API_KEY` in the Render dashboard (optional)
4. After deploy, run migrations via Render shell:
   ```bash
   npm run migrate --workspace=apps/api
   npm run seed --workspace=apps/api
   ```

## Deploy frontends to Vercel

Create **two** Vercel projects from the same repo:

### Velora (storefront)
- Root Directory: `apps/web`
- Environment: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`

### Orbit (admin)
- Root Directory: `apps/admin`
- Environment: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`

## Run tests locally

```bash
# Unit tests only (no database required)
npm run test --workspace=apps/api -- --testNamePattern="health|predict|coupons"

# Full suite (requires Postgres + seed)
npm run db:migrate && npm run db:seed
npm run test --workspace=apps/api
```
