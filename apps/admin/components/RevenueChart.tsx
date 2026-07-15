import type { RevenueTrendPoint } from "cartmind-shared-types";

interface RevenueChartProps {
  data: RevenueTrendPoint[];
  accentColor: string;
}

export function RevenueChart({ data, accentColor }: RevenueChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium">Revenue Trend (7 days)</h3>
      <div className="mt-6 flex h-40 items-end justify-between gap-2">
        {data.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full max-w-[40px] rounded-t-md transition-all"
              style={{
                height: `${Math.max(8, (point.value / max) * 100)}%`,
                background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}88 100%)`,
              }}
              title={`$${point.value.toFixed(0)}`}
            />
            <span className="text-[10px] text-muted">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
