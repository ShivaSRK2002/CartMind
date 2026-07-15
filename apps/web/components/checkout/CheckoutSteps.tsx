const STEPS = [
  { id: "bag", label: "Bag" },
  { id: "checkout", label: "Checkout" },
  { id: "confirmation", label: "Confirmation" },
] as const;

export type CheckoutStepId = (typeof STEPS)[number]["id"];

export function CheckoutSteps({ current }: { current: CheckoutStepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Checkout progress" className="border-b border-border-subtle bg-surface">
      <ol className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-5 lg:px-8">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id} className="flex items-center gap-2">
              {index > 0 && (
                <span
                  className={`hidden h-px w-8 sm:block ${isComplete ? "bg-brand-primary" : "bg-border-warm"}`}
                  aria-hidden
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? "bg-brand-primary text-white"
                      : isCurrent
                        ? "border-2 border-brand-primary text-brand-primary"
                        : "border border-border-warm text-text-subtle"
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.12em] ${
                    isCurrent ? "font-medium text-foreground" : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
