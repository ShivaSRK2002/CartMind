import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function handleLoginRequest(
  request: Request,
  options: { requireRole?: "admin" } = {},
): Promise<NextResponse> {
  const body = await request.json();

  const apiResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await apiResponse.json();

  if (!apiResponse.ok || !result.success) {
    return NextResponse.json(result, { status: apiResponse.status });
  }

  if (options.requireRole && result.data.user.role !== options.requireRole) {
    return NextResponse.json(
      { success: false, error: `This account does not have ${options.requireRole} access` },
      { status: 403 },
    );
  }

  const response = NextResponse.json(result);
  response.cookies.set(SESSION_COOKIE_NAME, result.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
