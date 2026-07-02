import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST() {
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
