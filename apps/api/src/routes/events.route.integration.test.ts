import { describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("POST /api/v1/events", () => {
  it("stores a valid behavioral event and returns 201", async () => {
    const res = await api()
      .post("/api/v1/events")
      .send({
        eventType: "search_query",
        sessionId: "test-session-1",
        payload: { query: "headphones", resultCount: 5 },
      })
      .expect(201);

    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.eventType).toBe("search_query");
  });

  it("returns 400 for an unknown event type", async () => {
    const res = await api()
      .post("/api/v1/events")
      .send({
        eventType: "invalid_event",
        sessionId: "test-session-2",
        payload: {},
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid occurredAt timestamp", async () => {
    const res = await api()
      .post("/api/v1/events")
      .send({
        eventType: "product_viewed",
        sessionId: "test-session-ts",
        occurredAt: "not-a-date",
        payload: {},
      })
      .expect(400);

    expect(res.body.error).toMatch(/occurredAt/i);
  });

  it("attaches the authenticated user when a bearer token is present", async () => {
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "password123" });
    const token = login.body.data.token as string;

    const res = await api()
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventType: "add_to_cart",
        sessionId: "test-session-authed",
        occurredAt: new Date().toISOString(),
        payload: { productId: "x", quantity: 1 },
      })
      .expect(201);

    expect(res.body.data.eventType).toBe("add_to_cart");
  });
});

describeIfDb("POST /api/v1/events/batch", () => {
  it("ingests a batch of events and reports the count", async () => {
    const res = await api()
      .post("/api/v1/events/batch")
      .send({
        events: [
          { eventType: "product_viewed", sessionId: "batch-1", payload: { productId: "a" } },
          { eventType: "add_to_cart", sessionId: "batch-1", payload: { productId: "a", quantity: 2 } },
          { eventType: "checkout_started", sessionId: "batch-1", payload: { cartValue: 120 } },
        ],
      })
      .expect(201);

    expect(res.body.data.ingested).toBe(3);
    expect(res.body.data.events).toHaveLength(3);
    expect(res.body.data.events[0].id).toBeTruthy();
  });

  it("returns 400 for an empty batch", async () => {
    const res = await api()
      .post("/api/v1/events/batch")
      .send({ events: [] })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("returns 400 when a batch event is malformed", async () => {
    const res = await api()
      .post("/api/v1/events/batch")
      .send({ events: [{ eventType: "not_real", sessionId: "batch-2", payload: {} }] })
      .expect(400);

    expect(res.body.error).toMatch(/batch/i);
  });

  it("returns 400 when a batch event has an invalid occurredAt", async () => {
    const res = await api()
      .post("/api/v1/events/batch")
      .send({
        events: [
          { eventType: "product_viewed", sessionId: "batch-3", occurredAt: "nope", payload: {} },
        ],
      })
      .expect(400);

    expect(res.body.error).toMatch(/occurredAt/i);
  });
});

describeIfDb("POST /api/v1/auth/login", () => {
  it("returns a token for seeded admin credentials", async () => {
    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "password123" })
      .expect(200);

    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe("admin");
  });

  it("returns 401 for invalid credentials", async () => {
    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@cartmind.ai", password: "wrong-password" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
