"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    setIsSubmitting(false);

    if (!res.ok || !result.success) {
      setError(result.error ?? "Login failed");
      return;
    }

    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
    router.push(result.data.user.role === "admin" ? adminUrl : returnUrl);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-primary hover:text-brand-primary-hover">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <p className="font-display text-3xl font-medium text-foreground">Welcome Back</p>
        <span className="accent-line mx-auto" />
        <p className="mt-4 text-sm text-text-muted">Sign in to continue to checkout</p>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-text-muted">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
