import { redirect, notFound } from "next/navigation";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { getOrderById, getUserProfile } from "@/lib/orders";
import { formatPrice } from "@/lib/productMeta";
import { getEstimatedDeliveryDate, OrderItemsList } from "@/components/account/OrderItemsList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderStatusBadge, formatOrderId } from "@/components/account/orderUtils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getSession();
  const token = await getSessionToken();
  const { id } = await params;

  if (!session || !token) {
    redirect("/login");
  }

  let order;
  try {
    order = await getOrderById(token, id);
  } catch {
    notFound();
  }

  const user = await getUserProfile(token);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: formatOrderId(order.id) },
        ]}
      />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <AccountNav active="order-detail" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              title={`Order ${formatOrderId(order.id)}`}
              subtitle={new Date(order.createdAt).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="border border-border-subtle bg-surface p-5 lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                Items ({order.items.length})
              </p>
              <div className="mt-4">
                <OrderItemsList items={order.items} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-border-subtle bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                  Customer
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-text-subtle">Name</dt>
                    <dd className="text-foreground">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-text-subtle">Email</dt>
                    <dd className="text-foreground">{user.email}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-border-subtle bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                  Delivery
                </p>
                <p className="mt-3 text-sm text-foreground">
                  {order.status === "paid"
                    ? `Estimated by ${getEstimatedDeliveryDate(order.createdAt)}`
                    : "Pending confirmation"}
                </p>
              </div>

              <div className="border border-border-subtle bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                  Payment Summary
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Items</dt>
                    <dd>{order.items.length}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-3 font-medium">
                    <dt>Total</dt>
                    <dd className="font-display text-lg text-brand-primary">
                      {formatPrice(order.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
