import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../test/request";

/**
 * Use-case §10 latency targets: behavioral event ingestion < 2s, dashboard
 * load < 3s. Measured in-process (app + Postgres, no network hop) so the
 * numbers are a conservative floor — real deployments add only network time.
 * We assert generous ceilings (well inside the targets) and log the p50/p95.
 */
const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function timeIt(fn: () => Promise<unknown>, runs: number): Promise<number[]> {
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  return samples;
}

describeIfDb("Latency budget (use-case §10)", () => {
  let adminToken = "";

  beforeAll(async () => {
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "password123" });
    adminToken = login.body.data.token;
  });

  it("event ingestion stays well under the 2s target", async () => {
    const samples = await timeIt(
      () =>
        api()
          .post("/api/v1/events")
          .send({ eventType: "product_viewed", sessionId: `perf-${Date.now()}`, payload: {} })
          .expect(201),
      20,
    );
    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    console.log(`  event ingest: p50 ${p50.toFixed(1)}ms  p95 ${p95.toFixed(1)}ms  (target < 2000ms)`);
    expect(p95).toBeLessThan(2000);
    expect(p50).toBeLessThan(500);
  });

  it("admin dashboard load stays well under the 3s target", async () => {
    const samples = await timeIt(
      () =>
        api()
          .get("/api/v1/admin/dashboard/velora")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200),
      10,
    );
    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    console.log(`  dashboard load: p50 ${p50.toFixed(1)}ms  p95 ${p95.toFixed(1)}ms  (target < 3000ms)`);
    expect(p95).toBeLessThan(3000);
  });
});
