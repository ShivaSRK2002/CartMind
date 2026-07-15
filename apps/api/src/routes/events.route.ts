import { Router } from "express";
import { z } from "zod";
import { BEHAVIORAL_EVENTS } from "cartmind-shared-types";
import { insertEvent, insertEventsBatch } from "../services/events.service";
import { optionalAuth } from "../middleware/optionalAuth";
import { sendError, sendSuccess } from "../utils/response";

export const eventsRouter = Router();

const eventTypeSchema = z.enum(BEHAVIORAL_EVENTS);

const ingestEventSchema = z.object({
  eventType: eventTypeSchema,
  sessionId: z.string().min(1).max(128),
  anonymousId: z.string().min(1).max(128).optional(),
  payload: z.record(z.any()).default({}),
  occurredAt: z.string().optional(),
});

const batchSchema = z.object({
  events: z.array(ingestEventSchema).min(1).max(50),
});

eventsRouter.post("/", optionalAuth, async (req, res, next) => {
  const parsed = ingestEventSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid event payload", 400);
    return;
  }

  try {
    const event = await insertEvent(parsed.data, req.user?.sub);
    sendSuccess(res, event, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid occurredAt timestamp") {
      sendError(res, err.message, 400);
      return;
    }
    next(err);
  }
});

eventsRouter.post("/batch", optionalAuth, async (req, res, next) => {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid batch payload", 400);
    return;
  }

  try {
    const events = await insertEventsBatch(parsed.data.events, req.user?.sub);
    sendSuccess(res, { ingested: events.length, events }, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid occurredAt timestamp") {
      sendError(res, err.message, 400);
      return;
    }
    next(err);
  }
});
