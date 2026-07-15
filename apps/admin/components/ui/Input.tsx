import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none ${className}`}
      {...props}
    />
  );
}
