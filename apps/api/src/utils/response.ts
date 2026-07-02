import type { Response } from "express";
import type { ApiResponse } from "cartmind-shared-types";

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendError(res: Response, error: string, status = 400): void {
  const body: ApiResponse<never> = { success: false, error };
  res.status(status).json(body);
}
