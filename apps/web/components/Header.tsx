import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";
import { CartLink } from "./CartLink";
import { WishlistLink } from "./wishlist/WishlistLink";
import { HeaderSearchBar } from "./HeaderSearchBar";
import { CategoryNav } from "./CategoryNav";

const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-border-subtle bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4 lg:px-8">
          <Link href="/" className="shrink-0">
            <span className="font-display text-2xl font-medium tracking-tight text-foreground">
              Vel<span className="text-brand-primary">ora</span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:flex lg:max-w-xl lg:mx-auto">
            <HeaderSearchBar />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-6 text-sm">
            {session ? (
              <div className="group relative hidden sm:block">
                <button
                  type="button"
                  className="text-sm tracking-wide text-foreground transition-colors hover:text-brand-primary"
                >
                  {session.name.split(" ")[0]}
                  <span className="ml-1 text-text-subtle">▾</span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-border-subtle bg-surface py-2 text-foreground opacity-0 shadow-[var(--shadow-card)] transition-all group-hover:visible group-hover:opacity-100">
                  {session.role === "admin" ? (
                    <a
                      href={ADMIN_PORTAL_URL}
                      className="block px-5 py-2.5 text-sm transition-colors hover:bg-surface-muted"
                    >
                      Orbit Admin
                    </a>
                  ) : (
                    <>
                      <Link
                        href="/account"
                        className="block px-5 py-2.5 text-sm transition-colors hover:bg-surface-muted"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-5 py-2.5 text-sm transition-colors hover:bg-surface-muted"
                      >
                        Order History
                      </Link>
                    </>
                  )}
                  <div className="border-t border-border-subtle px-5 py-2.5">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm tracking-wide text-foreground transition-colors hover:text-brand-primary sm:block"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/account"
              className="hidden text-sm tracking-wide text-text-muted transition-colors hover:text-brand-primary md:block"
            >
              Account
            </Link>

            <WishlistLink />

            <CartLink />
          </nav>
        </div>

        <div className="border-t border-border-subtle px-6 pb-4 lg:hidden">
          <HeaderSearchBar />
        </div>
      </div>

      <CategoryNav />
    </header>
  );
}
