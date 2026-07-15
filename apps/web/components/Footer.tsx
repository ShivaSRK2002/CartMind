import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Discover",
    links: [
      { label: "Our Story", href: "/" },
      { label: "All Products", href: "/products" },
      { label: "Today's Deals", href: "/products?search=deal" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Help Centre", href: "/products" },
      { label: "Shipping", href: "/products" },
      { label: "Returns", href: "/account/orders" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "My Orders", href: "/account/orders" },
      { label: "My Account", href: "/account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-2xl font-medium text-foreground">
              Vel<span className="text-brand-primary">ora</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
              Shop bold. Live curated. A funky-fresh marketplace where every find has flair.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted transition-colors hover:text-brand-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-xs text-text-subtle">
            © {new Date().getFullYear()} Velora. All rights reserved.
          </p>
          <p className="text-xs text-text-subtle">
            Behavioral-analytics eCommerce demo — not a real store.
          </p>
        </div>
      </div>
    </footer>
  );
}
