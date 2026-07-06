import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Product not found</h1>
      <p className="text-sm text-gray-500">This product may have been removed.</p>
      <Link href="/products" className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
        Back to products
      </Link>
    </main>
  );
}
