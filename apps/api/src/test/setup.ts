import { config } from "dotenv";

// Load apps/api/.env so DB-backed integration tests run locally the same way
// they do in CI (where DATABASE_URL is set as a workflow env var).
config();

process.env.JWT_SECRET ??= "test-jwt-secret-for-vitest";
