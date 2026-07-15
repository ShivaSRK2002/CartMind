import { Router } from "express";
import { z } from "zod";
import { buildInsightContext } from "../lib/insightContext";
import { generateInsight } from "../lib/gemini";
import { ECOMMERCE_STORES } from "../lib/stores";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendError, sendSuccess } from "../utils/response";
import { fetchCustomers } from "./admin.dashboard";
import { buildStoreDashboard } from "./admin.dashboardBuilder";

export const adminRouter = Router();

const insightChatSchema = z.object({
  storeId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

adminRouter.get("/stores", requireAuth, requireRole("admin"), (_req, res) => {
  sendSuccess(res, { stores: ECOMMERCE_STORES });
});

adminRouter.get("/customers", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const customers = await fetchCustomers();
    sendSuccess(res, { customers });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/dashboard/:storeId", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const dashboard = await buildStoreDashboard(req.params.storeId);
    if (!dashboard) {
      sendError(res, "Store not found", 404);
      return;
    }
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/insights/chat", requireAuth, requireRole("admin"), async (req, res, next) => {
  const parsed = insightChatSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid chat payload", 400);
    return;
  }

  try {
    const dashboard = await buildStoreDashboard(parsed.data.storeId);
    if (!dashboard) {
      sendError(res, "Store not found", 404);
      return;
    }

    const context = buildInsightContext(dashboard);
    const result = await generateInsight(parsed.data.message, context);

    sendSuccess(res, {
      reply: result.reply,
      model: result.model,
      usedFallback: result.usedFallback,
    });
  } catch (err) {
    next(err);
  }
});
