"use client";

import { Input } from "@/components/ui/Input";
import { CardPreview } from "./CardPreview";
import {
  TEST_CARDS,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  type TestCard,
} from "@/lib/payment/dummyCards";

export interface CardPaymentState {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface PaymentFormProps {
  paymentMethod: "card" | "upi";
  onPaymentMethodChange: (method: "card" | "upi") => void;
  card: CardPaymentState;
  onCardChange: (card: CardPaymentState) => void;
  upiId: string;
  onUpiChange: (value: string) => void;
  fieldError?: string | null;
}

export function PaymentForm({
  paymentMethod,
  onPaymentMethodChange,
  card,
  onCardChange,
  upiId,
  onUpiChange,
  fieldError,
}: PaymentFormProps) {
  const brand = detectCardBrand(card.cardNumber);

  function applyTestCard(testCard: TestCard) {
    onCardChange({
      cardName: "Demo User",
      cardNumber: formatCardNumber(testCard.number),
      expiry: "12/30",
      cvv: "123",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        {(["card", "upi"] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onPaymentMethodChange(method)}
            className={`flex-1 border px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] transition-all ${
              paymentMethod === method
                ? "border-brand-primary bg-brand-primary-light text-brand-primary shadow-sm"
                : "border-border-warm text-text-muted hover:border-brand-primary"
            }`}
          >
            {method === "card" ? "Credit / Debit Card" : "UPI"}
          </button>
        ))}
      </div>

      {paymentMethod === "card" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <CardPreview
            cardNumber={card.cardNumber || "•••• •••• •••• ••••"}
            cardName={card.cardName}
            expiry={card.expiry}
            brand={brand}
          />

          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
                Quick fill — demo cards
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEST_CARDS.map((testCard) => (
                  <button
                    key={testCard.id}
                    type="button"
                    onClick={() => applyTestCard(testCard)}
                    className="border border-border-subtle bg-surface-muted/50 px-3 py-2.5 text-left text-xs transition-colors hover:border-brand-primary hover:bg-brand-primary-light/50"
                  >
                    <span className="font-medium text-foreground">{testCard.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-text-subtle">
                      {formatCardNumber(testCard.number)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                Name on Card
              </label>
              <Input
                value={card.cardName}
                onChange={(e) => onCardChange({ ...card, cardName: e.target.value })}
                placeholder="As printed on card"
                autoComplete="cc-name"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                Card Number
              </label>
              <Input
                value={card.cardNumber}
                onChange={(e) =>
                  onCardChange({ ...card, cardNumber: formatCardNumber(e.target.value) })
                }
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                  Expiry
                </label>
                <Input
                  value={card.expiry}
                  onChange={(e) => onCardChange({ ...card, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                  CVV
                </label>
                <Input
                  value={card.cvv}
                  onChange={(e) =>
                    onCardChange({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                  placeholder="123"
                  type="password"
                  autoComplete="cc-csc"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md">
          <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
            UPI ID
          </label>
          <Input
            value={upiId}
            onChange={(e) => onUpiChange(e.target.value)}
            placeholder="yourname@upi"
          />
          <button
            type="button"
            onClick={() => onUpiChange("demo@upi")}
            className="mt-2 text-xs text-brand-primary hover:underline"
          >
            Use demo UPI: demo@upi
          </button>
        </div>
      )}

      {fieldError && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fieldError}
        </div>
      )}

      <p className="text-xs text-text-subtle">
        Demo mode — use test cards above. No real charges are made.
      </p>
    </div>
  );
}

export function PaymentProcessingOverlay({ step }: { step: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-header/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm border border-border-subtle bg-surface p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-border-warm border-t-brand-primary" />
        <p className="mt-6 font-display text-lg text-foreground">Processing Payment</p>
        <p className="mt-2 text-sm text-text-muted">{step}</p>
      </div>
    </div>
  );
}
