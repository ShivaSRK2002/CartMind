import type {
  ApiResponse,
  CustomerOrderHistory,
  OrderWithItemDetails,
} from "cartmind-shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getOrderHistory(token: string): Promise<CustomerOrderHistory> {
  const res = await fetch(`${API_URL}/api/v1/orders/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result: ApiResponse<CustomerOrderHistory> = await res.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function getOrderById(token: string, orderId: string): Promise<OrderWithItemDetails> {
  const res = await fetch(`${API_URL}/api/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result: ApiResponse<OrderWithItemDetails> = await res.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export async function getUserProfile(token: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result: ApiResponse<{ user: { id: string; email: string; name: string; role: string; createdAt: string } }> =
    await res.json();
  if (!result.success) throw new Error(result.error);
  return result.data.user;
}
