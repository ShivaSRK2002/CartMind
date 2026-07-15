/** Deterministic mock marketplace metadata derived from product id (no DB changes). */

export interface ProductMeta {
  rating: number;
  reviewCount: number;
  mrp: number;
  discountPercent: number;
  salePrice: number;
  isAssured: boolean;
  deliveryDays: number;
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getProductMeta(productId: string, price: number): ProductMeta {
  const hash = hashId(productId);
  const rating = 3.5 + (hash % 16) / 10;
  const reviewCount = 50 + (hash % 9500);
  const discountPercent = 10 + (hash % 61);
  const mrp = Math.round(price / (1 - discountPercent / 100));
  const isAssured = hash % 3 !== 0;
  const deliveryDays = 1 + (hash % 5);

  return {
    rating: Math.min(5, Math.round(rating * 10) / 10),
    reviewCount,
    mrp,
    discountPercent,
    salePrice: price,
    isAssured,
    deliveryDays,
  };
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
