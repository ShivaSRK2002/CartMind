import type { DashboardKpis } from "cartmind-shared-types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

interface KpiGridProps {
  kpis: DashboardKpis;
}

const KPI_CONFIG = [
  { key: "revenue" as const, label: "Revenue", format: formatCurrency },
  { key: "orders" as const, label: "Orders", format: (v: number) => v.toLocaleString() },
  { key: "customers" as const, label: "Customers", format: (v: number) => v.toLocaleString() },
  {
    key: "conversionRate" as const,
    label: "Conversion",
    format: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    key: "avgOrderValue" as const,
    label: "Avg Order",
    format: formatCurrency,
  },
  {
    key: "eventVolume24h" as const,
    label: "Events (24h)",
    format: (v: number) => v.toLocaleString(),
  },
];

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {KPI_CONFIG.map(({ key, label, format }) => (
        <div key={key} className="glow-card rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{format(kpis[key])}</p>
        </div>
      ))}
    </div>
  );
}
