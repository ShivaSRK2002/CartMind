export const BEHAVIORAL_EVENTS = [
  "product_viewed",
  "add_to_cart",
  "remove_from_cart",
  "checkout_started",
  "payment_success",
  "wishlist_add",
  "coupon_applied",
  "search_query",
  "checkout_abandoned",
] as const;

export type BehavioralEventName = (typeof BEHAVIORAL_EVENTS)[number];

export interface BaseEventProperties {
  userId: string;
  sessionId: string;
  timestamp: string;
}

export interface ProductViewedEvent extends BaseEventProperties {
  productId: string;
  productName: string;
  category: string;
  price: number;
}

export interface AddToCartEvent extends BaseEventProperties {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface RemoveFromCartEvent extends BaseEventProperties {
  productId: string;
  quantity: number;
}

export interface CheckoutStartedEvent extends BaseEventProperties {
  cartId: string;
  cartValue: number;
  itemCount: number;
}

export interface PaymentSuccessEvent extends BaseEventProperties {
  orderId: string;
  amount: number;
  paymentMethod: string;
}

export interface WishlistAddEvent extends BaseEventProperties {
  productId: string;
  productName: string;
}

export interface CouponAppliedEvent extends BaseEventProperties {
  couponCode: string;
  discountAmount: number;
}

export interface SearchQueryEvent extends BaseEventProperties {
  query: string;
  resultCount: number;
}

export interface CheckoutAbandonedEvent extends BaseEventProperties {
  cartId: string;
  cartValue: number;
  lastStep: string;
}

export interface BehavioralEventPayloadMap {
  product_viewed: ProductViewedEvent;
  add_to_cart: AddToCartEvent;
  remove_from_cart: RemoveFromCartEvent;
  checkout_started: CheckoutStartedEvent;
  payment_success: PaymentSuccessEvent;
  wishlist_add: WishlistAddEvent;
  coupon_applied: CouponAppliedEvent;
  search_query: SearchQueryEvent;
  checkout_abandoned: CheckoutAbandonedEvent;
}
