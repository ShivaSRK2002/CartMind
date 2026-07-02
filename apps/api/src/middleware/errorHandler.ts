import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  sendError(res, message, 500);
}
