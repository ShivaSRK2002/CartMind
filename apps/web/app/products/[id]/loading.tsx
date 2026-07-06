export default function ProductDetailLoading() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-200" />
      </div>
    </main>
  );
}
