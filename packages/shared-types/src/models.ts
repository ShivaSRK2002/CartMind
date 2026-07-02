import type { BehavioralEventName } from "./events";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "customer" | "admin";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: "pending" | "paid" | "cancelled";
  totalAmount: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface EventRecord {
  id: string;
  eventType: BehavioralEventName;
  userId: string | null;
  sessionId: string;
  anonymousId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
  receivedAt: string;
}

export interface AnalyticsSummary {
  id: string;
  summaryType: string;
  dimension: string | null;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  computedAt: string;
}
