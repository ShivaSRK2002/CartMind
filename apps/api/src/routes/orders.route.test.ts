import { describe, it } from "vitest";

describe("GET /api/v1/orders/me", () => {
  it.todo("returns the current user's orders with items and a lifetime total");
  it.todo("returns an empty orders array and zero lifetime total for a new user");
  it.todo("returns 401 when no token is provided");
});
