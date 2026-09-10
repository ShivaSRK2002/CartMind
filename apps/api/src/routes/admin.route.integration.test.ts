import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("Admin routes", () => {
  let adminToken = "";
  let customerToken = "";

  beforeAll(async () => {
    const admin = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "password123" });
    adminToken = admin.body.data.token;

    const customer = await api()
      .post("/api/v1/auth/login")
      .send({ email: "dave@example.com", password: "password123" });
    customerToken = customer.body.data.token;
  });

  it("GET /admin/stores returns the store list for an admin", async () => {
    const res = await api()
      .get("/api/v1/admin/stores")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.stores.length).toBeGreaterThan(0);
    expect(res.body.data.stores.some((s: { id: string }) => s.id === "velora")).toBe(true);
  });

  it("GET /admin/stores returns 403 for a customer token", async () => {
    await api()
      .get("/api/v1/admin/stores")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("GET /admin/stores returns 401 without a token", async () => {
    await api().get("/api/v1/admin/stores").expect(401);
  });

  it("GET /admin/customers returns customers with order count + lifetime value", async () => {
    const res = await api()
      .get("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.customers.length).toBeGreaterThan(0);
    expect(res.body.data.customers[0]).toHaveProperty("lifetimeValue");
  });

  it("GET /admin/dashboard/velora returns live KPIs, events, ML insights and cohorts", async () => {
    const res = await api()
      .get("/api/v1/admin/dashboard/velora")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.kpis).toHaveProperty("revenue");
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.data.ml.aggregate).toHaveProperty("modelVersion");
    expect(res.body.data.cohorts.length).toBe(4);
  });

  it("GET /admin/dashboard/:unknown returns 404", async () => {
    await api()
      .get("/api/v1/admin/dashboard/nope")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("GET /admin/dashboard/<demo store> returns a synthetic dashboard", async () => {
    const res = await api()
      .get("/api/v1/admin/dashboard/bloommart")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.data.store.status).toBe("demo");
    expect(res.body.data.kpis).toHaveProperty("revenue");
    expect(res.body.data.cohorts.length).toBe(4);
    expect(res.body.data.revenueTrend.length).toBe(7);
  });

  it("GET /admin/dashboard/velora returns 401 without a token", async () => {
    await api().get("/api/v1/admin/dashboard/velora").expect(401);
  });

  it("GET /admin/customers returns 403 for a customer token", async () => {
    await api()
      .get("/api/v1/admin/customers")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("POST /admin/insights/chat returns a reply (Gemini or rule-based fallback)", async () => {
    const res = await api()
      .post("/api/v1/admin/insights/chat")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ storeId: "velora", message: "What is our cart abandonment rate?" })
      .expect(200);
    expect(typeof res.body.data.reply).toBe("string");
    expect(res.body.data.reply.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty("usedFallback");
  });

  it("POST /admin/insights/chat returns 400 for an invalid payload", async () => {
    await api()
      .post("/api/v1/admin/insights/chat")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ storeId: "velora" })
      .expect(400);
  });
});
