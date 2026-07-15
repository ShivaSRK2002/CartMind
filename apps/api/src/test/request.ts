import request from "supertest";
import { createApp } from "../app";

const app = createApp();

export function api() {
  return request(app);
}

export { app };
