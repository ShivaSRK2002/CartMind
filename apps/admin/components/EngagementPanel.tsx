import type { EngagementInsights } from "cartmind-shared-types";

function heatColor(intensity: number): string {
  // pale amber -> deep rust, matching the Velora accent family
  const t = Math.max(0, Math.min(1, intensity));
  const r = Math.round(250 - t * 128);
  const g = Math.round(240 - t * 170);
  const b = Math.round(230 - t * 190);
  return `rgb(${r}, ${g}, ${b})`;
}

export function EngagementPanel({ engagement }: { engagement: EngagementInsights }) {
  const { heatmap, depthFunnel, avgEventsPerSession, medianSessionDepth } = engagement;
  const entry = depthFunnel[0]?.sessions || 1;

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium">Engagement &amp; Attention</h3>
      <p className="mt-1 text-xs text-muted">
        Catalogue click density and session-depth funnel — from the raw behavioral event stream (30d)
      </p>

      <div className="mt-4 flex gap-6 text-xs text-muted">
        <span>
          Avg events / session{" "}
          <span className="font-semibold text-foreground tabular-nums">{avgEventsPerSession}</span>
        </span>
        <span>
          Median session depth{" "}
          <span className="font-semibold text-foreground tabular-nums">{medianSessionDepth}</span>
        </span>
      </div>

      {/* Catalogue heatmap */}
      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted">Product click density</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {heatmap.map((cell) => (
          <div
            key={cell.productId}
            title={`${cell.name} — ${cell.views} views, ${cell.addToCarts} carts, ${cell.purchases} bought`}
            className="flex aspect-square flex-col justify-between rounded-md p-1.5 text-[9px] leading-tight text-[#3a2a20]"
            style={{ backgroundColor: heatColor(cell.intensity) }}
          >
            <span className="line-clamp-2 font-medium">{cell.name}</span>
            <span className="tabular-nums opacity-80">{cell.views}</span>
          </div>
        ))}
      </div>

      {/* Depth funnel */}
      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
        Session engagement depth
      </p>
      <div className="mt-2 space-y-2">
        {depthFunnel.map((stage) => (
          <div key={stage.stage}>
            <div className="flex items-center justify-between text-xs">
              <span>{stage.stage}</span>
              <span className="tabular-nums text-muted">
                {stage.sessions.toLocaleString()} · {stage.pctOfEntry}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${Math.max(2, (stage.sessions / entry) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
