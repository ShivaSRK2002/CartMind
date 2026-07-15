import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const apiResponse = await fetch(`${API_URL}/api/v1/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await apiResponse.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: apiResponse.status });
    } catch {
      return NextResponse.json({ success: false, error: "Invalid API response" }, { status: 502 });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Cannot reach event ingestion service" },
      { status: 503 },
    );
  }
}
