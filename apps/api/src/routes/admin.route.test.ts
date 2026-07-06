import { describe, it } from "vitest";

describe("GET /api/v1/admin/customers", () => {
  it.todo("returns customers with order count and lifetime value, ordered by lifetime value desc");
  it.todo("returns 401 when no token is provided");
  it.todo("returns 403 for a non-admin token");
});
