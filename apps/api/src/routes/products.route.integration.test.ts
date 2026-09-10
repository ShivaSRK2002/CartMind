import { describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("GET /api/v1/products", () => {
  it("returns a paginated list of products", async () => {
    const res = await api().get("/api/v1/products?page=1&pageSize=12").expect(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(12);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.page).toBe(1);
  });

  it("filters by category", async () => {
    const res = await api().get("/api/v1/products?category=Electronics").expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    for (const p of res.body.data.items) expect(p.category).toBe("Electronics");
  });

  it("filters by search term", async () => {
    const res = await api().get("/api/v1/products?search=headphones").expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it("returns 400 for an invalid pageSize", async () => {
    await api().get("/api/v1/products?pageSize=999").expect(400);
  });
});

describeIfDb("GET /api/v1/products/:id", () => {
  it("returns a single product with its images", async () => {
    const list = await api().get("/api/v1/products?pageSize=1");
    const id = list.body.data.items[0].id as string;

    const res = await api().get(`/api/v1/products/${id}`).expect(200);
    expect(res.body.data.id).toBe(id);
    expect(Array.isArray(res.body.data.images)).toBe(true);
  });

  it("returns 400 for a non-uuid id", async () => {
    await api().get("/api/v1/products/not-a-uuid").expect(400);
  });

  it("returns 404 for an unknown id", async () => {
    await api()
      .get("/api/v1/products/00000000-0000-0000-0000-000000000000")
      .expect(404);
  });
});

describeIfDb("GET /api/v1/products/recommendations", () => {
  it("returns recommendation items for a seed product", async () => {
    const list = await api().get("/api/v1/products?pageSize=1");
    const seed = list.body.data.items[0].id as string;

    const res = await api()
      .get(`/api/v1/products/recommendations?seedProductIds=${seed}&limit=5`)
      .expect(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
  });

  it("returns items with no seed (popularity fallback)", async () => {
    const res = await api().get("/api/v1/products/recommendations?limit=6").expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it("personalizes recommendations for an authenticated buyer", async () => {
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "password123" });
    const token = login.body.data.token as string;

    const list = await api().get("/api/v1/products?pageSize=2");
    const seed = list.body.data.items[0].id as string;
    const exclude = list.body.data.items[1].id as string;

    const res = await api()
      .get(`/api/v1/products/recommendations?seedProductIds=${seed}&excludeIds=${exclude}&limit=8`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeLessThanOrEqual(8);
    for (const p of res.body.data.items) expect(p.id).not.toBe(exclude);
  });

  it("returns 400 for an invalid limit", async () => {
    await api().get("/api/v1/products/recommendations?limit=999").expect(400);
  });
});
