import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    variant === "primary"
      ? "bg-accent text-background hover:opacity-90"
      : "border border-border bg-transparent text-foreground hover:border-accent hover:text-accent";

  return (
    <button
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${base} ${className}`}
      {...props}
    />
  );
}
