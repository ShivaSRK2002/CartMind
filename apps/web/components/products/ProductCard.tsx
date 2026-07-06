import Link from "next/link";
import type { Product } from "cartmind-shared-types";
import { buildPlaceholderImage, colorForCategory } from "@/lib/placeholderImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl ?? buildPlaceholderImage(product.name, colorForCategory(product.category))}
        alt={product.name}
        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
        <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        <p className="mt-auto text-base font-semibold">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
