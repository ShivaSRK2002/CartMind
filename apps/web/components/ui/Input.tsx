import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-md border border-border-warm bg-surface px-3 py-2 focus:border-brand-primary focus:outline-none ${className}`}
      {...props}
    />
  );
}
