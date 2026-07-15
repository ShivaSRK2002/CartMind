"use client";

import { useWishlist } from "@/lib/wishlist/WishlistContext";

export function WishlistButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border-warm bg-surface/90 text-lg backdrop-blur-sm transition-colors hover:border-brand-primary hover:text-brand-primary ${className}`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
