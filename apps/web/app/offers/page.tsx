import Link from "next/link";
import type { ApiResponse, Banner, PaginatedProducts, Product } from "cartmind-shared-types";
import { DEMO_COUPONS } from "cartmind-shared-types";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductRow } from "@/components/products/ProductRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getProductMeta } from "@/lib/productMeta";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/banners`, { cache: "no-store" });
    const result: ApiResponse<{ items: Banner[] }> = await res.json();
    return result.success ? result.data.items : [];
  } catch {
    return [];
  }
}

async function getAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products?page=1&pageSize=60`, { cache: "no-store" });
    const result: ApiResponse<PaginatedProducts> = await res.json();
    return result.success ? result.data.items : [];
  } catch {
    return [];
  }
}

export default async function OffersPage() {
  const [banners, products] = await Promise.all([getBanners(), getAllProducts()]);

  const dealProducts = [...products]
    .map((p) => ({ product: p, meta: getProductMeta(p.id, p.price) }))
    .sort((a, b) => b.meta.discountPercent - a.meta.discountPercent)
    .slice(0, 12)
    .map((entry) => entry.product);

  const flashDeals = dealProducts.slice(0, 6);
  const topDiscounts = dealProducts.slice(6, 12);

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

        <div className="mt-6">
          <SectionHeading
            title="Offers & Deals"
            subtitle="Limited-time savings, promo codes, and hand-picked markdowns"
          />
        </div>

        {banners.length > 0 && (
          <div className="mt-8">
            <BannerCarousel banners={banners} />
          </div>
        )}

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {DEMO_COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="border border-border-subtle bg-surface p-6 premium-shadow-card"
            >
              <p className="font-display text-xl text-brand-primary">{coupon.code}</p>
              <p className="mt-2 text-sm text-text-muted">{coupon.label}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-text-subtle">
                Apply at checkout
              </p>
            </div>
          ))}
        </section>

        <div className="mt-12">
          <ProductRow
            title="Flash Deals"
            subtitle="Biggest discounts right now"
            products={flashDeals}
            viewAllHref="/products?search=deal"
          />
        </div>

        {topDiscounts.length > 0 && (
          <div className="mt-4">
            <ProductRow
              title="More Ways to Save"
              subtitle="Extra value across categories"
              products={topDiscounts}
            />
          </div>
        )}

        <section className="mt-12 border border-brand-primary/20 bg-brand-primary/5 p-8 text-center">
          <p className="font-display text-2xl text-foreground">Members get early access</p>
          <p className="mt-2 text-sm text-text-muted">
            Sign in to unlock personalized offers based on your shopping style
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block bg-brand-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-primary-hover"
          >
            Sign In for Deals
          </Link>
        </section>
      </div>
    </main>
  );
}
