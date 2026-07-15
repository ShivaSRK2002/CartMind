import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "buy" | "cart" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-hover border border-brand-primary tracking-[0.12em] uppercase text-xs font-medium",
  secondary:
    "bg-transparent text-foreground border border-border-warm hover:border-brand-primary hover:text-brand-primary tracking-[0.12em] uppercase text-xs font-medium",
  buy: "bg-brand-buy text-white hover:bg-brand-buy-hover border border-brand-buy tracking-[0.12em] uppercase text-xs font-medium",
  cart: "bg-brand-primary text-white hover:bg-brand-primary-hover border border-brand-primary tracking-[0.12em] uppercase text-xs font-medium",
  ghost:
    "bg-transparent text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-white tracking-[0.12em] uppercase text-xs font-medium",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-sm px-6 py-3 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
