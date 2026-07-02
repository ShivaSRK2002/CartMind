import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: "customer" | "admin";
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "7d";

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AuthTokenPayload;
}
