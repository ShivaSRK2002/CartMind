import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const NAV_ITEMS = [
  { label: "Overview", href: "/account" },
  { label: "Order History", href: "/account/orders" },
];

export function AccountNav({ active }: { active: "overview" | "orders" | "order-detail" }) {
  return (
    <aside className="lg:w-56 shrink-0">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            (active === "overview" && item.href === "/account") ||
            (active === "orders" && item.href === "/account/orders") ||
            (active === "order-detail" && item.href === "/account/orders");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-l-2 py-2.5 pl-4 text-sm transition-colors ${
                isActive
                  ? "border-brand-primary font-medium text-brand-primary"
                  : "border-transparent text-text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mt-4 border-t border-border-subtle pt-4 pl-4">
          <LogoutButton />
        </div>
      </nav>
    </aside>
  );
}
