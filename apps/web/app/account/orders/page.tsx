import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getOrderHistory } from "@/lib/orders";
import { formatPrice } from "@/lib/productMeta";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge, formatOrderId } from "@/components/account/orderUtils";

export default async function OrdersPage() {
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    redirect("/login");
  }

  const { orders, lifetimeTotal } = await getOrderHistory(token);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Order History" },
        ]}
      />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <AccountNav active="orders" />

        <div className="min-w-0 flex-1">
          <SectionHeading
            title="Order History"
            subtitle={`${orders.length} order${orders.length !== 1 ? "s" : ""} · Lifetime spend ${formatPrice(lifetimeTotal)}`}
          />

          {orders.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-text-muted">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/products"
                className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.15em] text-brand-primary"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="border border-border-subtle bg-surface premium-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
                    <div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="font-medium text-foreground hover:text-brand-primary"
                      >
                        {formatOrderId(order.id)}
                      </Link>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-display text-lg font-medium">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <ul className="divide-y divide-border-subtle">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex gap-4 px-5 py-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            item.productImageUrl ??
                            buildPlaceholderImage(item.productName, "#7A4E35", 64, 80)
                          }
                          alt={item.productName}
                          className="h-16 w-14 shrink-0 object-cover bg-surface-muted"
                        />
                        <div className="flex min-w-0 flex-1 justify-between gap-4">
                          <div>
                            <p className="text-sm text-foreground">{item.productName}</p>
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

                  <div className="border-t border-border-subtle px-5 py-3 text-right">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-xs font-medium uppercase tracking-[0.12em] text-brand-primary hover:text-brand-primary-hover"
                    >
                      View Details →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
