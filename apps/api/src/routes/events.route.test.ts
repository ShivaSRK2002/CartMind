import { describe, it } from "vitest";

describe("POST /api/v1/events", () => {
  it.todo("stores a valid behavioral event and returns 201");
  it.todo("attaches user_id when a valid JWT is provided");
  it.todo("returns 400 for an unknown event type");
});

describe("POST /api/v1/events/batch", () => {
  it.todo("stores up to 50 events in one request");
  it.todo("returns 400 when the batch is empty");
});
