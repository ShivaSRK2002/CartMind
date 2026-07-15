import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const query = new URLSearchParams();
  const limit = searchParams.get("limit");
  const seedProductIds = searchParams.get("seedProductIds");
  const excludeIds = searchParams.get("excludeIds");

  if (limit) query.set("limit", limit);
  if (seedProductIds) query.set("seedProductIds", seedProductIds);
  if (excludeIds) query.set("excludeIds", excludeIds);

  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const apiResponse = await fetch(`${API_URL}/api/v1/products/recommendations?${query}`, {
    headers,
    cache: "no-store",
  });

  const text = await apiResponse.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: apiResponse.status });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid API response" }, { status: 502 });
  }
}
