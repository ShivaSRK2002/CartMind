import { describe, it } from "vitest";

describe("GET /api/v1/products", () => {
  it.todo("returns a paginated list of products");
  it.todo("filters by category");
  it.todo("searches by name");
  it.todo("returns 400 for invalid query parameters");
});

describe("GET /api/v1/products/:id", () => {
  it.todo("returns a product with its images");
  it.todo("returns 404 for a nonexistent product");
  it.todo("returns 400 for a malformed id");
});
