import type { EventMetric } from "cartmind-shared-types";

interface EventBreakdownProps {
  events: EventMetric[];
}

function formatEventName(name: string) {
  return name.replace(/_/g, " ");
}

export function EventBreakdown({ events }: EventBreakdownProps) {
  const sorted = [...events].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((e) => e.count), 1);

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium">Behavioral Events (7 days)</h3>
      <p className="mt-1 text-xs text-muted">RudderStack CDP — 9 instrumented events</p>
      <ul className="mt-5 space-y-3">
        {sorted.map((event) => (
          <li key={event.eventType}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="capitalize text-muted">{formatEventName(event.eventType)}</span>
              <span className="tabular-nums">
                {event.count.toLocaleString()}
                {event.trendPct !== 0 && (
                  <span className={event.trendPct > 0 ? "text-success" : "text-danger"}>
                    {" "}
                    {event.trendPct > 0 ? "+" : ""}
                    {event.trendPct}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${(event.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
