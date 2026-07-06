import { notFound } from "next/navigation";
import type { ApiResponse, ProductWithImages } from "cartmind-shared-types";
import { ProductDetailView } from "@/components/products/ProductDetailView";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<ProductWithImages | null> {
  const res = await fetch(`${API_URL}/api/v1/products/${id}`, { cache: "no-store" });

  if (res.status === 404) {
    return null;
  }

  const result: ApiResponse<ProductWithImages> = await res.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
