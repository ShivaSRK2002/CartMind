"use client";

import type { Product } from "cartmind-shared-types";
import { trackAddToCart } from "@/lib/analytics/track";
import { useCart } from "@/lib/cart/CartContext";

export function QuickAddToCart({
  product,
  className = "",
  variant = "overlay",
}: {
  product: Pick<Product, "id" | "name" | "price" | "imageUrl">;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const cart = useCart();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    trackAddToCart({ id: product.id, name: product.name, price: product.price }, 1);
    cart.addItem(
      { productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl },
      1,
    );
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`translate-y-2 bg-surface/95 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-foreground opacity-0 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand-primary hover:text-white ${className}`}
      >
        Add to Bag
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full border border-border-warm bg-transparent py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-all hover:border-brand-primary hover:text-brand-primary ${className}`}
    >
      Add to Bag
    </button>
  );
}
