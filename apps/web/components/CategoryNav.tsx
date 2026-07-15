import Link from "next/link";

const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home & Kitchen",
  "Books",
  "Sports & Outdoors",
];

export function CategoryNav() {
  return (
    <nav className="border-b border-border-subtle bg-surface-muted/50">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 overflow-x-auto px-6 py-3 text-xs uppercase tracking-[0.15em] scrollbar-hide lg:px-8">
        <Link
          href="/products"
          className="shrink-0 px-4 py-1 text-foreground transition-colors hover:text-brand-primary"
        >
          All
        </Link>
        <span className="text-border-warm" aria-hidden>
          |
        </span>
        {CATEGORIES.map((name) => (
          <Link
            key={name}
            href={`/products?category=${encodeURIComponent(name)}`}
            className="shrink-0 px-4 py-1 text-text-muted transition-colors hover:text-brand-primary"
          >
            {name}
          </Link>
        ))}
        <span className="text-border-warm" aria-hidden>
          |
        </span>
        <Link
          href="/offers"
          className="shrink-0 px-4 py-1 font-medium text-brand-primary transition-colors hover:text-brand-primary-hover"
        >
          Offers
        </Link>
        <Link
          href="/wishlist"
          className="shrink-0 px-4 py-1 text-text-muted transition-colors hover:text-brand-primary"
        >
          Wishlist
        </Link>
        <Link
          href="/products?search=deal"
          className="shrink-0 px-4 py-1 text-text-muted transition-colors hover:text-brand-primary"
        >
          Deals
        </Link>
      </div>
    </nav>
  );
}
