import Link from "next/link";

export function CategoryFilterChips({
  categories,
  activeCategory,
  search,
}: {
  categories: string[];
  activeCategory?: string;
  search?: string;
}) {
  function hrefFor(category?: string) {
    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    if (search) {
      params.set("search", search);
    }
    return `/products?${params.toString()}`;
  }

  function chipClass(isActive: boolean) {
    return `rounded-full px-3 py-1 text-sm ${
      isActive ? "bg-slate-900 text-white" : "border border-gray-300 hover:bg-gray-50"
    }`;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link href={hrefFor(undefined)} className={chipClass(!activeCategory)}>
        All
      </Link>
      {categories.map((category) => (
        <Link key={category} href={hrefFor(category)} className={chipClass(activeCategory === category)}>
          {category}
        </Link>
      ))}
    </div>
  );
}
