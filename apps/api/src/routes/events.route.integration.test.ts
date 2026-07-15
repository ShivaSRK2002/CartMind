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
