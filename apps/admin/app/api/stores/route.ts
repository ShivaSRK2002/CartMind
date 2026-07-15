import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiResponse = await fetch(`${API_URL}/api/v1/admin/stores`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const text = await apiResponse.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: apiResponse.status });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid API response" }, { status: 502 });
  }
}
