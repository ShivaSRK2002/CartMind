import { describe, it, expect } from "vitest";
import { api } from "../test/request";

describe("GET /api/v1/health", () => {
  it("returns { success: true, data: { status: 'ok' } } for a basic request", async () => {
    const res = await api().get("/api/v1/health").expect(200);
    expect(res.body).toEqual({ success: true, data: { status: "ok" } });
  });

  it("returns uptimeSeconds when verbose=true", async () => {
    const res = await api().get("/api/v1/health?verbose=true").expect(200);
    expect(res.body.data.status).toBe("ok");
    expect(typeof res.body.data.uptimeSeconds).toBe("number");
  });

  it("returns { success: false, error } for an invalid query param", async () => {
    const res = await api().get("/api/v1/health?verbose=maybe").expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
  });
});
