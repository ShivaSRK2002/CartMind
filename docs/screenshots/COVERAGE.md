# API test coverage summary

Captured: 2026-09-10 (Vitest + `@vitest/coverage-v8`, against seeded Postgres)

## Results

| Metric | Value |
|--------|-------|
| Test files | **11 passed**, 0 skipped |
| Tests | **63 passed**, 0 todo |
| Statements | **89.31%** (1362 / 1525) |
| Branches | **77.14%** (216 / 280) |
| Functions | **92.30%** (48 / 52) |
| Lines | **89.31%** (1362 / 1525) |

## Coverage by area

- `src/routes` — **90.9%** (auth, products, orders, banners, admin, events, health all DB-integration tested)
- `src/lib/ml` — **94.4%** (predict 100%, scoring 99.5%, k-means 96.8%, pythonScores 69.1%)
- `src/lib` — **81.8%** (recommendations 89%, stores 100%, insightContext 87.8%; `gemini.ts` live-API path uncovered by design)
- `src/services`, `src/utils`, `src/db`, `src/app` — **100%**
- `src/middleware` — auth 89.3%, optionalAuth 91.7%

## Test suites

| Suite | Tests |
|-------|-------|
| `auth.route.integration.test.ts` | 9 — register/login/me, 401/403/409 paths |
| `products.route.integration.test.ts` | 11 — list/paginate/filter/search, detail, recommendations (seeded + personalized + 400) |
| `orders.route.integration.test.ts` | 7 — create (coupon, stock, 400/401), me, by id, 404 |
| `admin.route.integration.test.ts` | 12 — stores, customers, live + demo dashboards, insights chat, RBAC (401/403) |
| `events.route.integration.test.ts` | 11 — single + batch ingest, validation, bad timestamp, auth attach |
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
