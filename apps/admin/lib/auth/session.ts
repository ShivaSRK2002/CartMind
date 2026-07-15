import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";

export async function getSession(): Promise<AuthTokenPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
