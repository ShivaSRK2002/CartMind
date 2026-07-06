"use client";

export default function ProductDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong loading this product</h1>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        Try again
      </button>
    </main>
  );
}
