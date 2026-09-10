import { describe, expect, it } from "vitest";
import { api } from "../test/request";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb("GET /api/v1/banners", () => {
  it("returns only active banners ordered by display_order", async () => {
    const res = await api().get("/api/v1/banners").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    for (const b of res.body.data.items) expect(b.isActive).toBe(true);

    const orders = res.body.data.items.map((b: { displayOrder: number }) => b.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
