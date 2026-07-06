"use client";

import { useEffect, useState } from "react";
import type { ProductWithImages } from "cartmind-shared-types";
import { trackAddToCart, trackProductViewed } from "@/lib/analytics/track";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export function ProductDetailView({ product }: { product: ProductWithImages }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    trackProductViewed({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product.id, product.name, product.category, product.price]);

  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: "fallback",
            productId: product.id,
            imageUrl: product.imageUrl ?? "https://picsum.photos/seed/placeholder/800/800",
            displayOrder: 0,
            createdAt: "",
          },
        ];

  function handleAddToCart() {
    trackAddToCart({ id: product.id, name: product.name, price: product.price }, quantity);
    setToastMessage(`Added ${quantity} × ${product.name} to cart`);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImageIndex].imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                aria-label={`View image ${index + 1}`}
                className={`h-16 w-16 overflow-hidden rounded border-2 ${
                  index === activeImageIndex ? "border-slate-900" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
        <p className={product.stock > 0 ? "text-sm text-green-600" : "text-sm text-red-600"}>
          {product.stock > 0 ? `In stock (${product.stock} available)` : "Out of stock"}
        </p>
        <p className="text-gray-700">{product.description}</p>

        {product.stock > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </label>
            <select
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1"
            >
              {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-2 w-full md:w-auto"
        >
          {product.stock === 0 ? "Out of stock" : "Add to Cart"}
        </Button>
      </div>

      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </main>
  );
}
