import Link from "next/link";
import type { ApiResponse, Banner, PaginatedProducts } from "cartmind-shared-types";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProductRow } from "@/components/products/ProductRow";
import { RecommendedProducts } from "@/components/recommendations/RecommendedProducts";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildPlaceholderImage, colorForCategory } from "@/lib/placeholderImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CATEGORY_NAMES = ["Electronics", "Apparel", "Home & Kitchen", "Books", "Sports & Outdoors"];

const CATEGORIES = CATEGORY_NAMES.map((name) => ({
  name,
  image: buildPlaceholderImage(name, colorForCategory(name), 600, 800),
}));

const TRUST_ITEMS = [
  { label: "Complimentary Shipping", desc: "On orders above ₹499" },
  { label: "Easy Returns", desc: "Within 30 days" },
  { label: "Secure Checkout", desc: "Encrypted payments" },
  { label: "Verified Sellers", desc: "Quality assured" },
];

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/banners`, { cache: "no-store" });
    const result: ApiResponse<{ items: Banner[] }> = await res.json();
    if (!result.success) return [];
    return result.data.items;
  } catch {
    return [];
  }
}

async function getProducts(pageSize = 6): Promise<PaginatedProducts["items"]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products?page=1&pageSize=${pageSize}`, {
      cache: "no-store",
    });
    const result: ApiResponse<PaginatedProducts> = await res.json();
    if (!result.success) return [];
    return result.data.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [banners, allProducts] = await Promise.all([getBanners(), getProducts(12)]);
  const dealsProducts = allProducts.slice(0, 6);

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-8">
        {banners.length > 0 && <BannerCarousel banners={banners} />}
      </div>

      <section className="border-y border-border-subtle bg-surface mt-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4 lg:px-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand-primary">
                {item.label}
              </p>
              <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        <SectionHeading
          title="Shop by Category"
          subtitle="Browse our thoughtfully organized collections"
          align="center"
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative aspect-[3/4] overflow-hidden bg-surface-muted premium-shadow premium-shadow-hover transition-shadow duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-header/80 via-brand-header/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-lg text-brand-header-text">{category.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-brand-header-text/60 transition-colors group-hover:text-brand-accent">
                  Shop Now
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 lg:px-8">
        <ProductRow
          title="Today's Selection"
          subtitle="Exceptional finds at remarkable prices"
          products={dealsProducts}
          viewAllHref="/products"
        />

        <RecommendedProducts
          title="Recommended for You"
          subtitle="Collaborative filtering based on your browsing & purchase patterns"
          limit={6}
        />

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Link
            href="/products?category=Electronics"
            className="group relative flex min-h-[220px] items-end overflow-hidden bg-brand-header p-8 premium-shadow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-header-secondary to-brand-header opacity-90" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-accent">
                Limited Offer
              </p>
              <h3 className="mt-2 font-display text-2xl text-brand-header-text">
                The Electronics Edit
              </h3>
              <p className="mt-2 text-sm text-brand-header-text/65">
                Premium tech, thoughtfully priced
              </p>
              <span className="mt-4 inline-block text-xs uppercase tracking-[0.15em] text-brand-accent transition-colors group-hover:text-brand-header-text">
                Discover →
              </span>
            </div>
          </Link>
          <Link
            href="/products?category=Apparel"
            className="group relative flex min-h-[220px] items-end overflow-hidden bg-brand-primary p-8 premium-shadow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-buy/80 to-brand-primary" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-accent">
                New Season
              </p>
              <h3 className="mt-2 font-display text-2xl text-white">The Style Collection</h3>
              <p className="mt-2 text-sm text-white/75">Refined apparel for every occasion</p>
              <span className="mt-4 inline-block text-xs uppercase tracking-[0.15em] text-brand-accent transition-colors group-hover:text-white">
                Discover →
              </span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
