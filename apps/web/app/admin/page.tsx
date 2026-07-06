import type { AdminCustomerSummary, ApiResponse } from "cartmind-shared-types";
import { getSessionToken } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getCustomers(token: string): Promise<AdminCustomerSummary[]> {
  const res = await fetch(`${API_URL}/api/v1/admin/customers`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result: ApiResponse<{ customers: AdminCustomerSummary[] }> = await res.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data.customers;
}

export default async function AdminDashboardPage() {
  const token = await getSessionToken();
  const customers = token ? await getCustomers(token) : [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Customers</h1>
      {customers.length === 0 ? (
        <p className="text-gray-500">No customers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Orders</th>
                <th className="px-4 py-2 font-medium">Lifetime Value</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{customer.name}</td>
                  <td className="px-4 py-2 text-gray-600">{customer.email}</td>
                  <td className="px-4 py-2">{customer.orderCount}</td>
                  <td className="px-4 py-2 font-semibold">${customer.lifetimeValue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
