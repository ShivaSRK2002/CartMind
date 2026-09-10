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

## One value to decide first: `JWT_SECRET`

The API issues JWTs; Velora and Orbit verify the session cookie with the
**same** secret. Pick one strong random string now and use it verbatim in
all three deploys below. (Generate one: `openssl rand -hex 32`.)

## Deploy API + Postgres to Render

1. Connect this repo to [Render](https://render.com) → **New → Blueprint** → pick this repo. Render reads `render.yaml` and provisions `velora-api` (Docker web service) + `velora-db` (free Postgres).
2. When prompted, set the un-synced env vars on `velora-api`:
   - `JWT_SECRET` = the value you chose above
   - `GEMINI_API_KEY` = your Gemini key (optional — rule-based fallback works without it)
3. Wait for the first build. `DATABASE_URL` is wired automatically from `velora-db`.
4. **Migrate + seed** — `velora-api` → **Shell**:
   ```bash
   cd /app/apps/api
   npm run migrate       # applies db/migrations/*.sql
   npm run seed:prod      # compiled seeder: 5 users, 30 products, banners, ~3y order history
   ```
   (Health check: `https://velora-api-XXXX.onrender.com/api/v1/health` → `{"success":true,"data":{"status":"ok"}}`)

## Deploy frontends to Vercel

Create **two** Vercel projects from the same repo (**Add New → Project**, import the repo twice).

### Velora (storefront)
- **Root Directory:** `apps/web`  (Vercel auto-detects `apps/web/vercel.json`)
- **Environment Variables:**
  | Key | Value |
  |-----|-------|
  | `NEXT_PUBLIC_API_URL` | `https://velora-api-XXXX.onrender.com` |
  | `NEXT_PUBLIC_ADMIN_URL` | your Orbit Vercel URL (set after Orbit deploys) |
  | `JWT_SECRET` | the same secret from above |

### Orbit (admin)
- **Root Directory:** `apps/admin`
- **Environment Variables:**
  | Key | Value |
  |-----|-------|
  | `NEXT_PUBLIC_API_URL` | `https://velora-api-XXXX.onrender.com` |
  | `JWT_SECRET` | the same secret from above |

### After both deploy
- Add Orbit's URL as `NEXT_PUBLIC_ADMIN_URL` on the Velora project and redeploy Velora.
- Log into Orbit with `admin@cartmind.ai` / `password123`.
- On Render `velora-api`, add `ALLOWED_ORIGINS` only if you tightened CORS (the API defaults to permissive CORS).

## Run tests locally

```bash
# Unit tests only (no database required)
npm run test --workspace=apps/api -- --testNamePattern="health|predict|coupons"

# Full suite (requires Postgres + seed)
npm run db:migrate && npm run db:seed
npm run test --workspace=apps/api
```
