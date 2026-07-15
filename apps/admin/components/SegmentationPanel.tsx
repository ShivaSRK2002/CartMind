import type { SegmentationCohort } from "cartmind-shared-types";

interface SegmentationPanelProps {
  cohorts: SegmentationCohort[];
}

export function SegmentationPanel({ cohorts }: SegmentationPanelProps) {
  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium">K-Means Segmentation</h3>
      <p className="mt-1 text-xs text-muted">Four behavioral cohorts</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {cohorts.map((cohort) => (
          <div
            key={cohort.id}
            className="rounded-lg border border-border bg-surface p-4"
            style={{ borderLeftWidth: 3, borderLeftColor: cohort.color }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{cohort.label}</span>
              <span className="text-xs text-muted">{cohort.revenueShare}% rev</span>
            </div>
            <p className="mt-1 text-xs text-muted">{cohort.description}</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {cohort.userCount.toLocaleString()} users
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
