import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt";

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (token) {
    try {
      req.user = verifyAuthToken(token);
    } catch {
      // Anonymous recommendations if token is invalid
    }
  }

  next();
}
