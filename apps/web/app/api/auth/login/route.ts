import { handleLoginRequest } from "@/lib/auth/login-handler";

export async function POST(request: Request) {
  return handleLoginRequest(request);
}
