export default function OrdersLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-2 h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-4 w-56 animate-pulse rounded bg-gray-200" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </main>
  );
}
