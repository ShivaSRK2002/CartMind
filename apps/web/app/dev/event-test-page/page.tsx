"use client";

import { useState } from "react";
import type { CartLineItem } from "cartmind-shared-types";
import {
  trackAddToCart,
  trackCheckoutAbandoned,
  trackCheckoutStarted,
  trackCouponApplied,
  trackPaymentSuccess,
  trackProductViewed,
  trackRemoveFromCart,
  trackSearchQuery,
  trackWishlistAdd,
} from "@/lib/analytics/track";

const DEMO_PRODUCT = {
  id: "demo-product-1",
  name: "Demo Wireless Headphones",
  category: "Electronics",
  price: 149.99,
};

const DEMO_CART_ITEMS: CartLineItem[] = [
  { productId: "demo-product-1", productName: "Demo Wireless Headphones", price: 149.99, quantity: 1 },
  { productId: "demo-product-2", productName: "Demo Yoga Mat", price: 24.99, quantity: 2 },
];

const DEMO_CART_TOTAL = DEMO_CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);

const EVENT_BUTTONS: { label: string; onFire: () => void }[] = [
  { label: "product_viewed", onFire: () => trackProductViewed(DEMO_PRODUCT) },
  { label: "add_to_cart", onFire: () => trackAddToCart(DEMO_PRODUCT, 1) },
  { label: "remove_from_cart", onFire: () => trackRemoveFromCart(DEMO_PRODUCT.id, 1) },
  {
    label: "checkout_started",
    onFire: () => trackCheckoutStarted({ items: DEMO_CART_ITEMS, totalAmount: DEMO_CART_TOTAL }),
  },
  {
    label: "payment_success",
    onFire: () =>
      trackPaymentSuccess({
        orderId: "demo-order-1",
        totalAmount: DEMO_CART_TOTAL,
        itemCount: DEMO_CART_ITEMS.length,
      }),
  },
  { label: "wishlist_add", onFire: () => trackWishlistAdd(DEMO_PRODUCT.id) },
  { label: "coupon_applied", onFire: () => trackCouponApplied("DEMO10", 10) },
  { label: "search_query", onFire: () => trackSearchQuery("wireless headphones", 12) },
  {
    label: "checkout_abandoned",
    onFire: () =>
      trackCheckoutAbandoned({ items: DEMO_CART_ITEMS, totalAmount: DEMO_CART_TOTAL }, "shipping_info"),
  },
];

export default function EventTestPage() {
  const [lastFired, setLastFired] = useState<string | null>(null);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">RudderStack Event Test Page</h1>
      <p className="text-sm text-gray-500">
        Fire each of the 9 canonical events, then check the browser console (debug mode) or the
        RudderStack dashboard live events view. Temporary page — remove once real UI exists.
      </p>
      <div className="flex flex-col gap-2">
        {EVENT_BUTTONS.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => {
              button.onFire();
              setLastFired(button.label);
            }}
            className="rounded border border-gray-300 px-4 py-2 text-left font-mono text-sm hover:bg-gray-100"
          >
            {button.label}
          </button>
        ))}
      </div>
      {lastFired && <p className="text-sm text-green-600">Last fired: {lastFired}</p>}
    </main>
  );
}
