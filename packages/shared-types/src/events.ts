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

export interface CartLineItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface ProductViewedPayload {
  productId: string;
  productName: string;
  category: string;
  price: number;
}

export interface AddToCartPayload {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface RemoveFromCartPayload {
  productId: string;
  quantity: number;
}

export interface CheckoutStartedPayload {
  items: CartLineItem[];
  totalAmount: number;
}

export interface PaymentSuccessPayload {
  orderId: string;
  totalAmount: number;
  itemCount: number;
}

export interface WishlistAddPayload {
  productId: string;
}

export interface CouponAppliedPayload {
  couponCode: string;
  discountAmount: number;
}

export interface SearchQueryPayload {
  query: string;
  resultCount: number;
}

export interface CheckoutAbandonedPayload {
  items: CartLineItem[];
  totalAmount: number;
  stage: string;
}

export interface BehavioralEventPayloadMap {
  product_viewed: ProductViewedPayload;
  add_to_cart: AddToCartPayload;
  remove_from_cart: RemoveFromCartPayload;
  checkout_started: CheckoutStartedPayload;
  payment_success: PaymentSuccessPayload;
  wishlist_add: WishlistAddPayload;
  coupon_applied: CouponAppliedPayload;
  search_query: SearchQueryPayload;
  checkout_abandoned: CheckoutAbandonedPayload;
}
