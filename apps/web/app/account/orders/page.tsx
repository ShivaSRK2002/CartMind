import { redirect } from "next/navigation";
import type { ApiResponse, CustomerOrderHistory } from "cartmind-shared-types";
import { getSession, getSessionToken } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getOrderHistory(token: string): Promise<CustomerOrderHistory> {
  const res = await fetch(`${API_URL}/api/v1/orders/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result: ApiResponse<CustomerOrderHistory> = await res.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default async function OrdersPage() {
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    redirect("/login");
  }

  const { orders, lifetimeTotal } = await getOrderHistory(token);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">My Orders</h1>
      <p className="mb-6 text-gray-600">
        Lifetime total spent: <span className="font-semibold">${lifetimeTotal.toFixed(2)}</span>
      </p>

      {orders.length === 0 ? (
        <p className="text-gray-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} · Order #{order.id.slice(0, 8)}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{order.items.length} item(s)</p>
              <p className="mt-1 font-semibold">${order.totalAmount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
