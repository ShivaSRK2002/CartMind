"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <Link href="/products" className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Your Cart</h1>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl ?? buildPlaceholderImage(item.name, "#334155", 100, 100)}
              alt={item.name}
              className="h-20 w-20 rounded object-cover"
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
            </div>
            <select
              aria-label={`Quantity for ${item.name}`}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="w-20 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              aria-label={`Remove ${item.name}`}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <p className="text-lg font-semibold">Subtotal: ${subtotal.toFixed(2)}</p>
        <Button disabled title="Checkout is coming in a future phase">
          Checkout (coming soon)
        </Button>
      </div>
    </main>
  );
}
