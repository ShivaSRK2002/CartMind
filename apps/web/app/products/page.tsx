import Link from "next/link";
import type { ApiResponse, PaginatedProducts } from "cartmind-shared-types";
import { SearchBar } from "@/components/products/SearchBar";
import { CategoryFilterChips } from "@/components/products/CategoryFilterChips";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchTracker } from "@/components/products/SearchTracker";

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
  if (params.category) {
    query.set("category", params.category);
  }
  if (params.search) {
    query.set("search", params.search);
  }

  const res = await fetch(`${API_URL}/api/v1/products?${query.toString()}`, { cache: "no-store" });
  const result: ApiResponse<PaginatedProducts> = await res.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const search = params.search;

  const data = await getProducts({ page, category, search });
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {search && <SearchTracker query={search} resultCount={data.total} />}
      <h1 className="mb-4 text-2xl font-semibold">Products</h1>
      <SearchBar initialQuery={search ?? ""} />
      <CategoryFilterChips categories={CATEGORIES} activeCategory={category} search={search} />

      {data.items.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No products found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const pageQuery = new URLSearchParams();
            if (category) {
              pageQuery.set("category", category);
            }
            if (search) {
              pageQuery.set("search", search);
            }
            pageQuery.set("page", String(pageNum));

            return (
              <Link
                key={pageNum}
                href={`/products?${pageQuery.toString()}`}
                className={`rounded px-3 py-1 text-sm ${
                  pageNum === page ? "bg-slate-900 text-white" : "border border-gray-300"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
