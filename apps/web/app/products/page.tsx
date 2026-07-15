import Link from "next/link";
import type { ApiResponse, PaginatedProducts } from "cartmind-shared-types";
import { SearchBar } from "@/components/products/SearchBar";
import { CategoryFilterChips } from "@/components/products/CategoryFilterChips";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchTracker } from "@/components/products/SearchTracker";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const PAGE_SIZE = 12;

const CATEGORIES = ["Electronics", "Apparel", "Home & Kitchen", "Books", "Sports & Outdoors"];

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

async function getProducts(params: {
  page: number;
  category?: string;
  search?: string;
}): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(PAGE_SIZE));
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);

  const res = await fetch(`${API_URL}/api/v1/products?${query.toString()}`, { cache: "no-store" });
  const result: ApiResponse<PaginatedProducts> = await res.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const search = params.search;

  const data = await getProducts({ page, category, search });
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const pageTitle = category ?? (search ? `"${search}"` : "All Products");

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    ...(category ? [{ label: category }] : []),
    ...(search && !category ? [{ label: `Search: ${search}` }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      {search && <SearchTracker query={search} resultCount={data.total} />}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-4 flex gap-10">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-40">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground">
              Categories
            </h2>
            <div className="mt-4">
              <CategoryFilterChips
                categories={CATEGORIES}
                activeCategory={category}
                search={search}
                variant="sidebar"
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-10 flex flex-col gap-6 border-b border-border-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title={pageTitle}
              subtitle={`${data.total} piece${data.total !== 1 ? "s" : ""} in this collection`}
            />
            <SearchBar initialQuery={search ?? ""} />
          </div>

          <div className="mb-8 lg:hidden">
            <CategoryFilterChips
              categories={CATEGORIES}
              activeCategory={category}
              search={search}
            />
          </div>

          {data.items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-xl text-foreground">No products found</p>
              <p className="mt-2 text-sm text-text-muted">Try adjusting your search or browse all collections</p>
              <Link
                href="/products"
                className="mt-6 inline-block text-xs font-medium uppercase tracking-[0.15em] text-brand-primary hover:text-brand-primary-hover"
              >
                View All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const pageQuery = new URLSearchParams();
                if (category) pageQuery.set("category", category);
                if (search) pageQuery.set("search", search);
                pageQuery.set("page", String(pageNum));

                return (
                  <Link
                    key={pageNum}
                    href={`/products?${pageQuery.toString()}`}
                    className={`flex h-10 w-10 items-center justify-center text-sm transition-colors ${
                      pageNum === page
                        ? "bg-brand-primary text-white"
                        : "border border-border-warm text-text-muted hover:border-brand-primary hover:text-brand-primary"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
