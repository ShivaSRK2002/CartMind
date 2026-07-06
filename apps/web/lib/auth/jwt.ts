import { jwtVerify } from "jose";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}

const encoder = new TextEncoder();

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const { payload } = await jwtVerify(token, encoder.encode(secret));
  return payload as unknown as AuthTokenPayload;
}
