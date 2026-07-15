import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("Behavioral pipeline E2E", () => {
  let adminToken: string;
  let productId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= "test-secret-key-for-ci";

    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "password123" })
      .expect(200);

    adminToken = login.body.data.token;

    const products = await api().get("/api/v1/products?pageSize=1").expect(200);
    productId = products.body.data.items[0].id;
  });

  it("captures a product_viewed event via ingestion API", async () => {
    const res = await api()
      .post("/api/v1/events")
      .send({
        eventType: "product_viewed",
        sessionId: `e2e-${Date.now()}`,
        payload: { productId, productName: "E2E Product", category: "Test", price: 10 },
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.eventType).toBe("product_viewed");
  });

  it("surfaces ingested events on the admin Velora dashboard", async () => {
    const res = await api()
      .get("/api/v1/admin/dashboard/velora")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.store.id).toBe("velora");
    expect(res.body.data.kpis).toBeDefined();
    expect(res.body.data.ml?.aggregate.modelVersion).toContain("velora-ml");
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  it("returns collaborative filtering recommendations", async () => {
    const res = await api()
      .get(`/api/v1/products/recommendations?limit=3&seedProductIds=${productId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].id).not.toBe(productId);
  });
});
