import Link from "next/link";
import type { Product } from "cartmind-shared-types";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ProductRow({
  title,
  subtitle,
  products,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-4">
      <div className="mb-8 flex items-end justify-between gap-4">
        <SectionHeading title={title} subtitle={subtitle} />
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 pb-1 text-xs font-medium uppercase tracking-[0.15em] text-brand-primary transition-colors hover:text-brand-primary-hover"
          >
            View All
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
