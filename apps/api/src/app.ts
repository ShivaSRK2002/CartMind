import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.route";
import { authRouter } from "./routes/auth.route";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);

  app.use(errorHandler);

  return app;
}
