"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function HeaderSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search our collection..."
        className="w-full rounded-full border border-border-warm bg-surface-muted/60 py-2.5 pl-5 pr-12 text-sm text-foreground placeholder:text-text-subtle transition-colors focus:border-brand-accent focus:bg-surface focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white transition-colors hover:bg-brand-primary-hover"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
}
