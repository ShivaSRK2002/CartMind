import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./routes/health.route";
import { authRouter } from "./routes/auth.route";
import { bannersRouter } from "./routes/banners.route";
import { productsRouter } from "./routes/products.route";
import { ordersRouter } from "./routes/orders.route";
import { eventsRouter } from "./routes/events.route";
import { adminRouter } from "./routes/admin.route";
import { errorHandler } from "./middleware/errorHandler";
import openApiSpec from "./openapi.json";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/banners", bannersRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/events", eventsRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
