import { describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("POST /api/v1/auth/register", () => {
  it("creates a customer user and returns { user, token }", async () => {
    const email = `it-${Date.now()}@example.com`;
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ email, password: "password123", name: "Integration Test" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.token).toBeTruthy();
  });

  it("returns 409 when the email is already registered", async () => {
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ email: "alice@example.com", password: "password123", name: "Dupe" })
      .expect(409);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for an invalid payload (short password)", async () => {
    await api()
      .post("/api/v1/auth/register")
      .send({ email: "bad@example.com", password: "short", name: "X" })
      .expect(400);
  });
});

describeIfDb("POST /api/v1/auth/login", () => {
  it("returns { user, token } for seeded customer credentials", async () => {
    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "password123" })
      .expect(200);
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.token).toBeTruthy();
  });

  it("returns 401 for a wrong password", async () => {
    await api()
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "nope" })
      .expect(401);
  });

  it("returns 401 for an unknown email", async () => {
    await api()
      .post("/api/v1/auth/login")
      .send({ email: "ghost@example.com", password: "password123" })
      .expect(401);
  });
});

describeIfDb("GET /api/v1/auth/me", () => {
  it("returns the authenticated user", async () => {
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "bob@example.com", password: "password123" });
    const token = login.body.data.token as string;

    const res = await api()
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.user.email).toBe("bob@example.com");
  });

  it("returns 401 without a token", async () => {
    await api().get("/api/v1/auth/me").expect(401);
  });

  it("returns 401 for a malformed token", async () => {
    await api()
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not-a-real-token")
      .expect(401);
  });
});
