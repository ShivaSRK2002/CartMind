"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { useCoupon } from "@/lib/coupon/CouponContext";
import { trackRemoveFromCart } from "@/lib/analytics/track";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import { formatPrice } from "@/lib/productMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CouponField } from "@/components/cart/CouponField";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const { applied } = useCoupon();

  function handleRemove(productId: string, quantity: number) {
    trackRemoveFromCart(productId, quantity);
    removeItem(productId);
  }

  function handleDecrease(productId: string, currentQty: number) {
    if (currentQty <= 1) {
      handleRemove(productId, 1);
      return;
    }
    trackRemoveFromCart(productId, 1);
    updateQuantity(productId, currentQty - 1);
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-24">
        <p className="font-display text-3xl font-medium text-foreground">Your bag is empty</p>
        <span className="accent-line" />
        <p className="mt-4 text-sm text-text-muted">Discover something you&apos;ll love</p>
        <Link
          href="/products"
          className="mt-8 inline-block border border-brand-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const discount = applied?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  return (
    <>
      <CheckoutSteps current="bag" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shopping Bag" }]} />

      <div className="mt-8 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading
            title="Your Bag"
            subtitle={`${items.length} item${items.length > 1 ? "s" : ""}`}
          />

          <div className="mt-8 divide-y divide-border-subtle">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 py-8 first:pt-0">
                <Link href={`/products/${item.productId}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl ?? buildPlaceholderImage(item.name, "#7A4E35", 120, 150)}
                    alt={item.name}
                    className="h-32 w-28 object-cover bg-surface-muted"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-display text-lg leading-snug text-foreground transition-colors hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-2 text-base font-medium">{formatPrice(item.price)}</p>
                  <p className="mt-1 text-xs text-brand-success">Complimentary delivery eligible</p>

                  <div className="mt-auto flex items-center gap-6 pt-4">
                    <div className="flex items-center border border-border-warm">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.productId, item.quantity)}
                        className="px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="border-x border-border-warm px-4 py-2 text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId, item.quantity)}
                      className="text-xs uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-brand-primary"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-40 border border-border-subtle bg-surface p-6 premium-shadow">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Order Summary</p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery</span>
                {deliveryFee === 0 ? (
                  <span>
                    <span className="text-text-subtle line-through">₹40</span>{" "}
                    <span className="text-brand-success">Complimentary</span>
                  </span>
                ) : (
                  <span>{formatPrice(deliveryFee)}</span>
                )}
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-success">
                  <span>Coupon ({applied?.coupon.code})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <CouponField subtotal={subtotal} />

            <div className="my-5 border-t border-border-subtle" />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-display text-xl">{formatPrice(total)}</span>
            </div>

            {deliveryFee > 0 && (
              <p className="mt-3 text-xs text-brand-success">
                Add {formatPrice(499 - subtotal)} more for complimentary delivery
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center bg-brand-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-primary-hover"
            >
              Proceed to Checkout
            </Link>
            <p className="mt-4 text-center text-xs text-text-subtle">
              Secure checkout · Easy returns
            </p>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
