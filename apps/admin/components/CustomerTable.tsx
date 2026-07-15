import type { AdminCustomerSummary } from "cartmind-shared-types";

interface CustomerTableProps {
  customers: AdminCustomerSummary[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="glow-card rounded-xl p-5">
        <h3 className="text-sm font-medium">Top Customers</h3>
        <p className="mt-4 text-sm text-muted">Demo stores use synthetic data. Switch to Velora for live customers.</p>
      </div>
    );
  }

  return (
    <div className="glow-card overflow-hidden rounded-xl">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-medium">Top Customers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">LTV</th>
            </tr>
          </thead>
          <tbody>
            {customers.slice(0, 8).map((customer) => (
              <tr key={customer.id} className="border-t border-border">
                <td className="px-5 py-3">{customer.name}</td>
                <td className="px-5 py-3 text-muted">{customer.email}</td>
                <td className="px-5 py-3 tabular-nums">{customer.orderCount}</td>
                <td className="px-5 py-3 font-medium tabular-nums">
                  ${customer.lifetimeValue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
