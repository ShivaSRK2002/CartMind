import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded border border-gray-300 px-3 py-2 focus:border-slate-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}
