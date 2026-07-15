import type { ShippingDetails } from "cartmind-shared-types";

export interface CheckoutReceipt {
  orderId: string;
  shipping: ShippingDetails;
  payment: {
    method: "card" | "upi";
    cardBrand?: string;
    last4?: string;
    cardLabel?: string;
    upiId?: string;
  };
  placedAt: string;
}

const STORAGE_KEY = "cartmind_checkout_receipt";

export function saveCheckoutReceipt(receipt: CheckoutReceipt): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(receipt));
}

export function getCheckoutReceipt(orderId: string): CheckoutReceipt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const receipt = JSON.parse(raw) as CheckoutReceipt;
    return receipt.orderId === orderId ? receipt : null;
  } catch {
    return null;
  }
}

export function clearCheckoutReceipt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
