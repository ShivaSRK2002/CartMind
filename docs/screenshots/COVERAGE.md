# API test coverage summary

Captured: 2026-07-15 (Vitest + `@vitest/coverage-v8`)

## Results

| Metric | Value |
|--------|-------|
| Test files | **5 passed**, 7 skipped (todo stubs) |
| Tests | **15 passed**, 32 todo |
| Statements | **54.48%** (789 / 1448) |
| Branches | **63.82%** (90 / 141) |
| Functions | **69.38%** (34 / 49) |
| Lines | **54.48%** (789 / 1448) |

## Highlights

- `src/lib/ml` — ~83–100% (predict, k-means, scoring)
- Health + pipeline integration tests exercising live Postgres
- HTML report snapshot: [`api-test-coverage.png`](./api-test-coverage.png)

Re-run:

```bash
npm run db:migrate && npm run db:seed
npm run test:coverage
```
