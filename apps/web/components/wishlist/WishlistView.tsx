"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "cartmind-shared-types";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function WishlistView() {
  const { productIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      ids: productIds.join(","),
      pageSize: String(productIds.length),
    });

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const byId = new Map(result.data.items.map((p: Product) => [p.id, p]));
          setProducts(productIds.map((id) => byId.get(id)).filter(Boolean) as Product[]);
        }
      })
      .finally(() => setIsLoading(false));
  }, [productIds]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />

      <div className="mt-8">
        <SectionHeading
          title="Your Wishlist"
          subtitle={
            productIds.length > 0
              ? `${productIds.length} saved item${productIds.length > 1 ? "s" : ""}`
              : "Save pieces you love with the heart icon"
          }
        />
      </div>

      {isLoading && <p className="mt-8 text-sm text-text-muted">Loading saved items...</p>}

      {!isLoading && productIds.length === 0 && (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl text-foreground">Nothing saved yet</p>
          <p className="mt-2 text-sm text-text-muted">Tap ♡ on any product to build your wishlist</p>
          <Link
            href="/products"
            className="mt-8 inline-block border border-brand-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
          >
            Explore Shop
          </Link>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
