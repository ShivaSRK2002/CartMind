import type { BehavioralEventName } from "./events";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  status: "active" | "converted" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceAtAdd: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  active: boolean;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  eventName: BehavioralEventName;
  userId: string | null;
  sessionId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
