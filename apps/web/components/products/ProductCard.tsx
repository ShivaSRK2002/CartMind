import Link from "next/link";
import type { Product } from "cartmind-shared-types";
import { buildPlaceholderImage, colorForCategory } from "@/lib/placeholderImage";
import { getProductMeta } from "@/lib/productMeta";
import { StarRating } from "@/components/ui/StarRating";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuickAddToCart } from "./QuickAddToCart";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const meta = getProductMeta(product.id, product.price);

  return (
    <article className="group relative flex flex-col">
      <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl ?? buildPlaceholderImage(product.name, colorForCategory(product.category))}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {meta.isAssured && (
            <span className="absolute left-3 top-3 bg-surface/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-brand-primary backdrop-blur-sm">
              Verified
            </span>
          )}
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
            <QuickAddToCart product={product} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-subtle">
            {product.category}
          </p>
          <h3 className="line-clamp-2 font-display text-base leading-snug text-foreground">
            {product.name}
          </h3>
          <StarRating rating={meta.rating} reviewCount={meta.reviewCount} />
          <PriceTag
            salePrice={meta.salePrice}
            mrp={meta.mrp}
            discountPercent={meta.discountPercent}
          />
        </div>
      </Link>
    </article>
  );
}
