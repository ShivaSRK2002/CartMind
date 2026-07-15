import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  const apiResponse = await fetch(`${API_URL}/api/v1/products${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  const text = await apiResponse.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: apiResponse.status });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid API response" }, { status: 502 });
  }
}
