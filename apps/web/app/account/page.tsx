import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getOrderHistory, getUserProfile } from "@/lib/orders";
import { formatPrice } from "@/lib/productMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge, formatOrderId } from "@/components/account/orderUtils";

export default async function AccountPage() {
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    redirect("/login");
  }

  const [user, { orders, lifetimeTotal }] = await Promise.all([
    getUserProfile(token),
    getOrderHistory(token),
  ]);

  const recentOrders = orders.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <AccountNav active="overview" />

        <div className="min-w-0 flex-1">
          <SectionHeading title="My Account" subtitle="Manage your profile and orders" />

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border border-border-subtle bg-surface p-6 premium-shadow">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                Profile
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-text-subtle">Name</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Email</dt>
                  <dd className="mt-0.5 text-foreground">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Member since</dt>
                  <dd className="mt-0.5 text-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-border-subtle bg-surface p-6 premium-shadow">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                Shopping Summary
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-text-subtle">Total orders</dt>
                  <dd className="mt-0.5 font-display text-2xl font-medium text-foreground">
                    {orders.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Lifetime spend</dt>
                  <dd className="mt-0.5 font-display text-2xl font-medium text-brand-primary">
                    {formatPrice(lifetimeTotal)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-medium text-foreground">Recent Orders</h2>
              {orders.length > 0 && (
                <Link
                  href="/account/orders"
                  className="text-xs font-medium uppercase tracking-[0.15em] text-brand-primary hover:text-brand-primary-hover"
                >
                  View All
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <p className="mt-6 text-sm text-text-muted">You haven&apos;t placed any orders yet.</p>
            ) : (
              <div className="mt-6 divide-y divide-border-subtle border border-border-subtle">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 bg-surface p-5 transition-colors hover:bg-surface-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatOrderId(order.id)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-medium">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
