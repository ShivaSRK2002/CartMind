const STATUS_STYLES: Record<string, string> = {
  paid: "bg-brand-success-light text-brand-success",
  cancelled: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Confirmed",
  cancelled: "Cancelled",
  pending: "Processing",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] ${STATUS_STYLES[status] ?? "bg-surface-muted text-text-muted"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function formatOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}
