import type { StoreMlInsights } from "cartmind-shared-types";

function riskColor(value: number): string {
  if (value >= 65) return "text-danger";
  if (value >= 40) return "text-warning";
  return "text-success";
}

export function MlScoresPanel({ ml }: { ml: StoreMlInsights }) {
  return (
    <div className="glow-card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">AI/ML Prediction Scores</h3>
          <p className="mt-1 text-xs text-muted">
            {ml.aggregate.modelVersion} · P {(ml.aggregate.precisionEstimate * 100).toFixed(0)}% · R{" "}
            {(ml.aggregate.recallEstimate * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Avg Churn Risk" value={ml.aggregate.avgChurnRisk} />
        <ScoreCard label="Cart Abandon Risk" value={ml.aggregate.avgCartAbandonmentRisk} />
        <ScoreCard label="Conversion Propensity" value={ml.aggregate.avgConversionPropensity} invert />
      </div>

      <p className="mt-4 text-xs text-muted">
        {ml.aggregate.highChurnUsers} users above 65% churn threshold
      </p>

      {ml.topAtRisk.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted uppercase tracking-wider">
              <tr>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Cohort</th>
                <th className="pb-2 font-medium">Churn</th>
                <th className="pb-2 font-medium">Abandon</th>
                <th className="pb-2 font-medium">Convert</th>
              </tr>
            </thead>
            <tbody>
              {ml.topAtRisk.map((user) => (
                <tr key={user.userId} className="border-t border-border">
                  <td className="py-2.5">
                    <span className="font-medium">{user.name}</span>
                    <span className="block text-muted">{user.email}</span>
                  </td>
                  <td className="py-2.5 capitalize text-muted">{user.cohort.replace("-", " ")}</td>
                  <td className={`py-2.5 tabular-nums ${riskColor(user.churnRisk)}`}>
                    {user.churnRisk}%
                  </td>
                  <td className={`py-2.5 tabular-nums ${riskColor(user.cartAbandonmentRisk)}`}>
                    {user.cartAbandonmentRisk}%
                  </td>
                  <td className="py-2.5 tabular-nums text-success">{user.conversionPropensity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const displayRisk = invert ? 100 - value : value;
  const color =
    displayRisk >= 65 ? "text-danger" : displayRisk >= 40 ? "text-warning" : "text-success";

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${invert ? "text-success" : color}`}>
        {value}%
      </p>
    </div>
  );
}
