"use client";

import { useEffect, useState } from "react";
import type { Product } from "cartmind-shared-types";
import { getViewedProductIds } from "@/lib/recommendations/viewHistory";
import { ProductRow } from "@/components/products/ProductRow";

interface RecommendedProductsProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  excludeProductId?: string;
  viewAllHref?: string;
}

export function RecommendedProducts({
  title = "Recommended for You",
  subtitle = "Personalized picks powered by collaborative filtering",
  limit = 6,
  excludeProductId,
  viewAllHref = "/products",
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const seeds = getViewedProductIds();
    const params = new URLSearchParams({ limit: String(limit) });
    if (seeds.length > 0) params.set("seedProductIds", seeds.join(","));
    if (excludeProductId) {
      params.set("excludeIds", excludeProductId);
    }

    fetch(`/api/recommendations?${params}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setProducts(result.data.items);
        }
      })
      .finally(() => setIsLoading(false));
  }, [limit, excludeProductId]);

  if (isLoading) {
    return (
      <section className="py-4">
        <p className="text-sm text-text-muted">Curating recommendations for you...</p>
      </section>
    );
  }

  return (
    <ProductRow
      title={title}
      subtitle={subtitle}
      products={products}
      viewAllHref={viewAllHref}
    />
  );
}
