import type { ApiObject } from "@rudderstack/analytics-js";
import type { BehavioralEventName, BehavioralEventPayloadMap, CartLineItem } from "cartmind-shared-types";
import { recordProductView } from "@/lib/recommendations/viewHistory";
import { getAnalytics } from "./client";
import { getAnalyticsSessionId, getAnonymousId } from "./session";

const isDebugEnabled = process.env.NEXT_PUBLIC_RUDDERSTACK_DEBUG === "true";

function persistEvent<K extends BehavioralEventName>(
  eventName: K,
  payload: BehavioralEventPayloadMap[K],
): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    eventType: eventName,
    sessionId: getAnalyticsSessionId(),
    anonymousId: getAnonymousId(),
    payload,
    occurredAt: new Date().toISOString(),
  });

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    if (isDebugEnabled) {
      console.warn(`[Pipeline] failed to persist event: ${eventName}`);
    }
  });
}

function sendEvent<K extends BehavioralEventName>(eventName: K, payload: BehavioralEventPayloadMap[K]): void {
  if (isDebugEnabled) {
    console.log(`[RudderStack] ${eventName}`, payload);
  }

  persistEvent(eventName, payload);

  const analytics = getAnalytics();
  if (!analytics) {
    if (isDebugEnabled) {
      console.warn(`[RudderStack] not initialized, CDP event skipped: ${eventName}`);
    }
    return;
  }

  analytics.track(eventName, payload as unknown as ApiObject);
}

export function trackProductViewed(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void {
  recordProductView(product.id);
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
