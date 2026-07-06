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

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
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

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CustomerOrderHistory {
  orders: OrderWithItems[];
  lifetimeTotal: number;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  lifetimeValue: number;
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

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
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
