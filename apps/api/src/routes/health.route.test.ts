import { describe, it, expect } from "vitest";

describe("GET /health", () => {
  it.todo("returns { success: true, data: { status: 'ok' } } for a basic request");
  it.todo("returns uptimeSeconds when verbose=true");
  it.todo("returns { success: false, error } for an invalid query param");
});
