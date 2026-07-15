"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OrderWithItemDetails } from "cartmind-shared-types";
import { formatPrice } from "@/lib/productMeta";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import { getCheckoutReceipt, clearCheckoutReceipt, type CheckoutReceipt } from "@/lib/checkout/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { OrderStatusBadge, formatOrderId } from "@/components/account/orderUtils";

interface OrderConfirmationViewProps {
  order: OrderWithItemDetails;
  userName: string;
}

function getEstimatedDelivery(placedAt: string): string {
  const date = new Date(placedAt);
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function OrderConfirmationView({ order, userName }: OrderConfirmationViewProps) {
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setReceipt(getCheckoutReceipt(order.id));
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, [order.id]);

  useEffect(() => {
    return () => {
      clearCheckoutReceipt();
    };
  }, []);

  const placedAt = receipt?.placedAt ?? order.createdAt;

  return (
    <>
      <CheckoutSteps current="confirmation" />

      <main
        className={`mx-auto w-full max-w-3xl flex-1 px-6 py-12 transition-all duration-700 lg:px-8 ${
          revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order Confirmed" }]} />

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-success-light">
            <svg className="h-10 w-10 text-brand-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-3xl font-medium text-foreground md:text-4xl">
            Thank you, {userName.split(" ")[0]}!
          </h1>
          <span className="accent-line mx-auto" />
          <p className="mt-4 text-sm text-text-muted">
            Payment successful. Your order is confirmed and on its way.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="border border-border-subtle bg-surface p-6 premium-shadow">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-text-muted">Order Number</p>
                <p className="mt-1 font-display text-xl text-foreground">{formatOrderId(order.id)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-text-subtle">Order Date</p>
                <p className="mt-0.5 text-foreground">
                  {new Date(placedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-text-subtle">Estimated Delivery</p>
                <p className="mt-0.5 text-foreground">{getEstimatedDelivery(placedAt)}</p>
              </div>
              <div>
                <p className="text-text-subtle">Total Paid</p>
                <p className="mt-0.5 font-display text-xl font-medium text-brand-primary">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {receipt && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-border-subtle bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                  Delivery Address
                </p>
                <address className="mt-3 not-italic text-sm leading-relaxed text-foreground">
                  {receipt.shipping.fullName}
                  <br />
                  {receipt.shipping.addressLine1}
                  <br />
                  {receipt.shipping.city}, {receipt.shipping.state} — {receipt.shipping.pincode}
                  <br />
                  <span className="text-text-muted">{receipt.shipping.phone}</span>
                </address>
              </div>

              <div className="border border-border-subtle bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
                  Payment Method
                </p>
                <div className="mt-3 text-sm text-foreground">
                  {receipt.payment.method === "card" ? (
                    <>
                      <p className="font-medium capitalize">
                        {receipt.payment.cardBrand ?? "Card"} ending in {receipt.payment.last4}
                      </p>
                      <p className="mt-1 text-xs text-brand-success">Payment successful</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">UPI — {receipt.payment.upiId}</p>
                      <p className="mt-1 text-xs text-brand-success">Payment successful</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border border-border-subtle bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
              Items Ordered
            </p>
            <ul className="mt-4 divide-y divide-border-subtle">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.productImageUrl ??
                      buildPlaceholderImage(item.productName, "#7A4E35", 80, 96)
                    }
                    alt={item.productName}
                    className="h-20 w-16 shrink-0 object-cover bg-surface-muted"
                  />
                  <div className="flex min-w-0 flex-1 justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-display text-foreground hover:text-brand-primary"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-text-muted">
                        Qty {item.quantity} · {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/account/orders/${order.id}`}
            className="inline-flex justify-center border border-brand-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
          >
            View Order Details
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex justify-center border border-border-warm px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:border-brand-primary"
          >
            Order History
          </Link>
          <Link
            href="/products"
            className="inline-flex justify-center bg-brand-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-primary-hover"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </>
  );
}
