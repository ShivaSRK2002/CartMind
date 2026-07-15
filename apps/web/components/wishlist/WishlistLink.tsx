"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist/WishlistContext";

export function WishlistLink() {
  const { productIds } = useWishlist();
  const count = productIds.length;

  return (
    <Link
      href="/wishlist"
      className="relative hidden text-sm tracking-wide text-text-muted transition-colors hover:text-brand-primary sm:block"
      aria-label={`Wishlist${count > 0 ? `, ${count} items` : ""}`}
    >
      Wishlist
      {count > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-medium text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
