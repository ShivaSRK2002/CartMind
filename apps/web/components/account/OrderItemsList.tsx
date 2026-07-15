import { formatPrice } from "@/lib/productMeta";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import Link from "next/link";
import type { OrderItemWithProduct } from "cartmind-shared-types";

export function getEstimatedDeliveryDate(createdAt: string, days = 5): string {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function OrderItemsList({ items }: { items: OrderItemWithProduct[] }) {
  return (
    <ul className="divide-y divide-border-subtle">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-4 first:pt-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              item.productImageUrl ?? buildPlaceholderImage(item.productName, "#7A4E35", 64, 80)
            }
            alt={item.productName}
            className="h-16 w-14 shrink-0 object-cover bg-surface-muted"
          />
          <div className="flex min-w-0 flex-1 justify-between gap-4">
            <div>
              <Link
                href={`/products/${item.productId}`}
                className="text-sm text-foreground hover:text-brand-primary"
              >
                {item.productName}
              </Link>
              <p className="mt-1 text-xs text-text-muted">
                Qty {item.quantity} · {formatPrice(item.unitPrice)} each
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {formatPrice(item.unitPrice * item.quantity)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
