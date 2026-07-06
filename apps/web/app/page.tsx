import Link from "next/link";
import type { ApiResponse, Banner } from "cartmind-shared-types";
import { BannerCarousel } from "@/components/BannerCarousel";
import { buildPlaceholderImage, colorForCategory } from "@/lib/placeholderImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const CATEGORY_NAMES = ["Electronics", "Apparel", "Home & Kitchen", "Books", "Sports & Outdoors"];

const CATEGORIES = CATEGORY_NAMES.map((name) => ({
  name,
  image: buildPlaceholderImage(name, colorForCategory(name), 400, 300),
}));

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/banners`, { cache: "no-store" });
    const result: ApiResponse<{ items: Banner[] }> = await res.json();
    if (!result.success) {
      return [];
    }
    return result.data.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const banners = await getBanners();

  return (
    <main className="flex flex-1 flex-col gap-10 pb-16">
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      <section className="mx-auto w-full max-w-6xl px-4">
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="group overflow-hidden rounded-lg border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={category.image}
                alt={category.name}
                className="h-32 w-full object-cover transition-transform group-hover:scale-105"
              />
              <p className="px-3 py-2 text-sm font-medium">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-lg bg-slate-900 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Welcome to CartMind AI</h2>
          <p className="mx-auto mt-2 max-w-xl text-gray-300">
            A behavioral-analytics eCommerce demo — browse products, track your journey, and see
            how every click becomes data.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/register"
              className="rounded bg-amber-400 px-5 py-2 font-medium text-slate-900 hover:bg-amber-300"
            >
              Create an account
            </Link>
            <Link
              href="/products"
              className="rounded border border-white px-5 py-2 font-medium hover:bg-white/10"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
