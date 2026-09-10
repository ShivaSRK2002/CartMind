# API test coverage summary

Captured: 2026-09-10 (Vitest + `@vitest/coverage-v8`, against seeded Postgres)

## Results

| Metric | Value |
|--------|-------|
| Test files | **11 passed**, 0 skipped |
| Tests | **52 passed**, 0 todo |
| Statements | **78.22%** (1193 / 1525) |
| Branches | **71.48%** (173 / 242) |
| Functions | **84.61%** (44 / 52) |
| Lines | **78.22%** (1193 / 1525) |

## Coverage by area

- `src/routes` — **86.9%** (auth, products, orders, banners, admin, events, health all DB-integration tested)
- `src/lib/ml` — **81%** (predict 100%, k-means 96.8%, scoring 75.9%, pythonScores 69.1%)
- `src/middleware/auth` — **89.3%**
- `src/utils`, `src/db`, `src/app` — **100%**

## Test suites

| Suite | Tests |
|-------|-------|
| `auth.route.integration.test.ts` | 9 — register/login/me, 401/403/409 paths |
| `products.route.integration.test.ts` | 9 — list/paginate/filter/search, detail, recommendations |
| `orders.route.integration.test.ts` | 7 — create (coupon, stock, 400/401), me, by id, 404 |
| `admin.route.integration.test.ts` | 8 — stores, customers, dashboard (KPIs/events/ML/cohorts), insights chat, RBAC |
| `events.route.integration.test.ts` | 4 — ingest, validation, auth attach |
| `pipeline.integration.test.ts` | 3 — end-to-end ML/dashboard |
| `health.route*.test.ts` | 6 — basic, verbose, invalid query |
| `coupons.test.ts`, `predict.test.ts` | 5 — pure-unit |

HTML report snapshot: [`api-test-coverage.png`](./api-test-coverage.png)

## Re-run

```bash
docker compose -f db/docker-compose.yml up -d
npm run db:migrate && npm run db:seed
npm run test:coverage
```
