import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";

export async function getSession(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
