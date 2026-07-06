"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative hover:text-amber-300">
      Cart
      {itemCount > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
