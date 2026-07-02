import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/jwt";
import { sendError } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    sendError(res, "Authentication required", 401);
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}

export function requireRole(role: AuthTokenPayload["role"]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Authentication required", 401);
      return;
    }

    if (req.user.role !== role) {
      sendError(res, "Forbidden", 403);
      return;
    }

    next();
  };
}
