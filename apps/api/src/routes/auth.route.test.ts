import { describe, it } from "vitest";

describe("POST /api/v1/auth/register", () => {
  it.todo("creates a customer user and returns { user, token }");
  it.todo("returns 409 when the email is already registered");
  it.todo("returns 400 for an invalid payload");
});

describe("POST /api/v1/auth/login", () => {
  it.todo("returns { user, token } for valid credentials");
  it.todo("returns 401 for an unknown email");
  it.todo("returns 401 for an incorrect password");
});

describe("GET /api/v1/auth/me", () => {
  it.todo("returns the current user for a valid Bearer token");
  it.todo("returns 401 when no token is provided");
  it.todo("returns 401 for an invalid or expired token");
});
