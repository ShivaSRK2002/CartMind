import type { ApiObject } from "@rudderstack/analytics-js";
import type { BehavioralEventName, BehavioralEventPayloadMap, CartLineItem } from "cartmind-shared-types";
import { getAnalytics } from "./client";

const isDebugEnabled = process.env.NEXT_PUBLIC_RUDDERSTACK_DEBUG === "true";

function sendEvent<K extends BehavioralEventName>(eventName: K, payload: BehavioralEventPayloadMap[K]): void {
  if (isDebugEnabled) {
    console.log(`[RudderStack] ${eventName}`, payload);
  }

  const analytics = getAnalytics();
  if (!analytics) {
    if (isDebugEnabled) {
      console.warn(`[RudderStack] not initialized, event dropped: ${eventName}`);
    }
    return;
  }

  // @rudderstack/analytics-js requires an indexed ApiObject; our nominal
  // payload interfaces are structurally compatible but lack an index
  // signature, so an explicit cast is needed at this SDK boundary.
  analytics.track(eventName, payload as unknown as ApiObject);
}

export function trackProductViewed(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void {
  sendEvent("product_viewed", {
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price,
  });
}

export function trackAddToCart(
  product: { id: string; name: string; price: number },
  quantity: number,
): void {
  sendEvent("add_to_cart", {
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity,
  });
}

export function trackRemoveFromCart(productId: string, quantity: number): void {
  sendEvent("remove_from_cart", { productId, quantity });
}

export function trackCheckoutStarted(cart: { items: CartLineItem[]; totalAmount: number }): void {
  sendEvent("checkout_started", { items: cart.items, totalAmount: cart.totalAmount });
}

export function trackPaymentSuccess(order: {
  orderId: string;
  totalAmount: number;
  itemCount: number;
}): void {
  sendEvent("payment_success", order);
}

export function trackWishlistAdd(productId: string): void {
  sendEvent("wishlist_add", { productId });
}

export function trackCouponApplied(couponCode: string, discountAmount: number): void {
  sendEvent("coupon_applied", { couponCode, discountAmount });
}

export function trackSearchQuery(query: string, resultCount: number): void {
  sendEvent("search_query", { query, resultCount });
}

export function trackCheckoutAbandoned(
  cart: { items: CartLineItem[]; totalAmount: number },
  stage: string,
): void {
  sendEvent("checkout_abandoned", { items: cart.items, totalAmount: cart.totalAmount, stage });
}
