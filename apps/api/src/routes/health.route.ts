import { Router } from "express";
import { z } from "zod";
import { sendSuccess, sendError } from "../utils/response";

export const healthRouter = Router();

const healthQuerySchema = z.object({
  verbose: z.enum(["true", "false"]).optional(),
});

healthRouter.get("/", (req, res) => {
  const parsed = healthQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, "Invalid query parameters", 400);
    return;
  }

  const data =
    parsed.data.verbose === "true"
      ? { status: "ok", uptimeSeconds: process.uptime() }
      : { status: "ok" };

  sendSuccess(res, data);
});
