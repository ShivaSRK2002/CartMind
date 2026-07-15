import Link from "next/link";

export function CategoryFilterChips({
  categories,
  activeCategory,
  search,
  variant = "chips",
}: {
  categories: string[];
  activeCategory?: string;
  search?: string;
  variant?: "chips" | "sidebar";
}) {
  function hrefFor(category?: string) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    return `/products?${params.toString()}`;
  }

  if (variant === "sidebar") {
    return (
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link
            href={hrefFor(undefined)}
            className={`block border-l-2 py-2 pl-4 text-sm transition-colors ${
              !activeCategory
                ? "border-brand-primary font-medium text-brand-primary"
                : "border-transparent text-text-muted hover:text-foreground"
            }`}
          >
            All Collections
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category}>
            <Link
              href={hrefFor(category)}
              className={`block border-l-2 py-2 pl-4 text-sm transition-colors ${
                activeCategory === category
                  ? "border-brand-primary font-medium text-brand-primary"
                  : "border-transparent text-text-muted hover:text-foreground"
              }`}
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(undefined)}
        className={`px-4 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
          !activeCategory
            ? "bg-brand-primary text-white"
            : "border border-border-warm text-text-muted hover:border-brand-primary hover:text-brand-primary"
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          className={`px-4 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
            activeCategory === category
              ? "bg-brand-primary text-white"
              : "border border-border-warm text-text-muted hover:border-brand-primary hover:text-brand-primary"
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
