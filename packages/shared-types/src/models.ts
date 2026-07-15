import type { BehavioralEventName } from "./events";
import type { StoreMlInsights } from "./ml";

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

export interface OrderItemWithProduct extends OrderItem {
  productName: string;
  productImageUrl: string | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderWithItemDetails extends Order {
  items: OrderItemWithProduct[];
}

export interface CustomerOrderHistory {
  orders: OrderWithItemDetails[];
  lifetimeTotal: number;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  deliveryFee?: number;
  couponCode?: string;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AdminCustomerSummary {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  lifetimeValue: number;
}

export interface EcommerceStore {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  storefrontUrl: string;
  status: "live" | "demo";
  accentColor: string;
}

export interface DashboardKpis {
  revenue: number;
  orders: number;
  customers: number;
  conversionRate: number;
  avgOrderValue: number;
  eventVolume24h: number;
}

export interface EventMetric {
  eventType: BehavioralEventName;
  count: number;
  trendPct: number;
}

export interface SegmentationCohort {
  id: string;
  label: string;
  description: string;
  userCount: number;
  revenueShare: number;
  color: string;
}

export interface RevenueTrendPoint {
  label: string;
  value: number;
}

export interface StoreDashboard {
  store: EcommerceStore;
  kpis: DashboardKpis;
  events: EventMetric[];
  cohorts: SegmentationCohort[];
  revenueTrend: RevenueTrendPoint[];
  customers: AdminCustomerSummary[];
  ml?: StoreMlInsights;
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
