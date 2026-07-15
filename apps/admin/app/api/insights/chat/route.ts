import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const apiResponse = await fetch(`${API_URL}/api/v1/admin/insights/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await apiResponse.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: apiResponse.status });
    } catch {
      return NextResponse.json({ success: false, error: "Invalid API response" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Cannot reach insight API" }, { status: 503 });
  }
}
