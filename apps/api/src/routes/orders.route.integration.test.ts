import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("Orders", () => {
  let token = "";
  let productId = "";
  let createdOrderId = "";

  beforeAll(async () => {
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "carol@example.com", password: "password123" });
    token = login.body.data.token;

    const list = await api().get("/api/v1/products?pageSize=1&category=Books");
    productId = list.body.data.items[0].id;
  });

  it("POST /orders creates a paid order and returns 201 with items", async () => {
    const res = await api()
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId, quantity: 1 }], deliveryFee: 0 })
      .expect(201);

    expect(res.body.data.status).toBe("paid");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.totalAmount).toBeGreaterThan(0);
    createdOrderId = res.body.data.id;
  });

  it("POST /orders applies a valid coupon", async () => {
    const res = await api()
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId, quantity: 2 }], couponCode: "VELORA10" })
      .expect(201);
    expect(res.body.data.totalAmount).toBeGreaterThan(0);
  });

  it("POST /orders returns 400 for an unknown product", async () => {
    await api()
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: "00000000-0000-0000-0000-000000000000", quantity: 1 }] })
      .expect(400);
  });

  it("POST /orders returns 401 without a token", async () => {
    await api()
      .post("/api/v1/orders")
      .send({ items: [{ productId, quantity: 1 }] })
      .expect(401);
  });

  it("GET /orders/me returns the user's orders and a lifetime total", async () => {
    const res = await api()
      .get("/api/v1/orders/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
    expect(res.body.data.lifetimeTotal).toBeGreaterThan(0);
  });

  it("GET /orders/:id returns a single order with items", async () => {
    const res = await api()
      .get(`/api/v1/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it("GET /orders/:id returns 404 for another user's / unknown order", async () => {
    await api()
      .get("/api/v1/orders/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
