import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const session = await getSession();

  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          CartMind <span className="text-amber-400">AI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:text-amber-300">
            Products
          </Link>
          {session ? (
            <>
              {session.role === "admin" && (
                <Link href="/admin" className="hover:text-amber-300">
                  Admin
                </Link>
              )}
              <span className="text-gray-300">Hi, {session.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-amber-300">
                Log in
              </Link>
              <Link href="/register" className="hover:text-amber-300">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
