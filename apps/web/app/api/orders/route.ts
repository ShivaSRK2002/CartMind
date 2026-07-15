import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseApiResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return {
      success: false,
      error: `Order service returned an empty response (${response.status}).`,
    };
  }

  try {
    return JSON.parse(text) as { success: boolean; error?: string; data?: unknown };
  } catch {
    return {
      success: false,
      error:
        response.status === 404
          ? "Order API endpoint not found. Restart the API server (npm run dev) to load the latest checkout code."
          : `Order service error (${response.status}). Ensure the API is running on ${API_URL}.`,
    };
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Please sign in to place an order." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid order request." }, { status: 400 });
  }

  try {
    const apiResponse = await fetch(`${API_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await parseApiResponse(apiResponse);
    const status = result.success ? apiResponse.status : apiResponse.status >= 400 ? apiResponse.status : 502;

    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: `Cannot reach the order service at ${API_URL}. Run "npm run dev" from the project root.`,
      },
      { status: 503 },
    );
  }
}
