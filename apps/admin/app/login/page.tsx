"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@cartmind.ai");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "admin_only"
      ? "This portal is for administrators only."
      : null,
  );
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

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-wider text-muted">
          Admin Email
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-wider text-muted">
          Password
        </label>
        <Input
          id="password"
          type="password"
          required
          placeholder="password123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Signing in..." : "Enter Orbit"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glow-card w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight">
            Orbit<span className="text-accent">.</span>
          </p>
          <p className="mt-2 text-sm text-muted">Multi-store commerce analytics</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-muted">Loading...</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted">
          Demo: admin@cartmind.ai / password123
        </p>
      </div>
    </main>
  );
}
