"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ShippingDetails } from "cartmind-shared-types";
import { useCart } from "@/lib/cart/CartContext";
import { useCoupon } from "@/lib/coupon/CouponContext";
import { formatPrice } from "@/lib/productMeta";
import { buildPlaceholderImage } from "@/lib/placeholderImage";
import { trackCheckoutStarted, trackPaymentSuccess } from "@/lib/analytics/track";
import { useCheckoutAbandonment } from "@/hooks/useCheckoutAbandonment";
import {
  detectCardBrand,
  getLast4,
  simulatePaymentDelay,
  stripCardNumber,
  validateCardPayment,
  validateUpiPayment,
} from "@/lib/payment/dummyCards";
import { saveCheckoutReceipt } from "@/lib/checkout/session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import {
  PaymentForm,
  PaymentProcessingOverlay,
  type CardPaymentState,
} from "@/components/checkout/PaymentForm";
import { CouponField } from "@/components/cart/CouponField";

interface CheckoutFormProps {
  userName: string;
  userEmail: string;
}

type CheckoutStep = "delivery" | "payment";

const PROCESSING_STEPS = [
  "Validating card details...",
  "Contacting payment gateway...",
  "Securing your transaction...",
  "Confirming your order...",
];

export function CheckoutForm({ userName, userEmail }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { applied, clearCoupon } = useCoupon();
  const orderCompletedRef = useRef(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: userName,
    email: userEmail,
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [card, setCard] = useState<CardPaymentState>({
    cardName: userName,
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [upiId, setUpiId] = useState("");

  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const discount = applied?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const cartLineItems = items.map((i) => ({
    productId: i.productId,
    productName: i.name,
    price: i.price,
    quantity: i.quantity,
  }));

  useCheckoutAbandonment({
    items: cartLineItems,
    totalAmount: total,
    stage: checkoutStep,
    completedRef: orderCompletedRef,
  });

  if (items.length === 0) {
    return (
      <>
        <CheckoutSteps current="checkout" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 text-center lg:px-8">
          <p className="font-display text-2xl text-foreground">Your bag is empty</p>
          <Link
            href="/products"
            className="mt-6 inline-block text-xs font-medium uppercase tracking-[0.15em] text-brand-primary"
          >
            Continue Shopping
          </Link>
        </main>
      </>
    );
  }

  function validateDelivery(): boolean {
    if (!shipping.fullName.trim() || !shipping.email.trim() || !shipping.phone.trim()) {
      setError("Please complete all contact fields.");
      return false;
    }
    if (!/^\d{10}$/.test(shipping.phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!shipping.addressLine1.trim() || !shipping.city.trim() || !shipping.state.trim()) {
      setError("Please complete your delivery address.");
      return false;
    }
    if (!/^\d{6}$/.test(shipping.pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleContinueToPayment(event: FormEvent) {
    event.preventDefault();
    if (validateDelivery()) {
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handlePlaceOrder(event: FormEvent) {
    event.preventDefault();
    setPaymentError(null);

    if (paymentMethod === "card") {
      const validation = validateCardPayment(card.cardNumber, card.expiry, card.cvv, card.cardName);
      if (!validation.ok) {
        setPaymentError(validation.error ?? "Invalid card details.");
        return;
      }
    } else {
      const validation = validateUpiPayment(upiId);
      if (!validation.ok) {
        setPaymentError(validation.error ?? "Invalid UPI ID.");
        return;
      }
    }

    setIsSubmitting(true);

    trackCheckoutStarted({
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      totalAmount: total,
    });

    for (const step of PROCESSING_STEPS) {
      setProcessingStep(step);
      await simulatePaymentDelay(650);
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryFee,
          couponCode: applied?.coupon.code,
        }),
      });

      let result: { success?: boolean; error?: string; data?: { id: string; totalAmount: number; items: unknown[] } };
      try {
        result = await res.json();
      } catch {
        setPaymentError("Unexpected server response. Please restart the dev servers and try again.");
        setIsSubmitting(false);
        setProcessingStep(null);
        return;
      }

      if (!res.ok || !result.success) {
        setPaymentError(result.error ?? "Order could not be placed. Please try again.");
        setIsSubmitting(false);
        setProcessingStep(null);
        return;
      }

      const order = result.data!;

      trackPaymentSuccess({
        orderId: order.id,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      });

      saveCheckoutReceipt({
        orderId: order.id,
        shipping,
        payment:
          paymentMethod === "card"
            ? {
                method: "card",
                cardBrand: detectCardBrand(card.cardNumber),
                last4: getLast4(card.cardNumber),
                cardLabel: stripCardNumber(card.cardNumber).startsWith("4242") ? "Visa" : "Card",
              }
            : { method: "upi", upiId: upiId.trim() },
        placedAt: new Date().toISOString(),
      });

      orderCompletedRef.current = true;
      clear();
      clearCoupon();
      router.push(`/checkout/confirmation?orderId=${order.id}`);
    } catch {
      setPaymentError("Cannot reach the server. Run npm run dev and ensure the API is on port 4000.");
      setIsSubmitting(false);
      setProcessingStep(null);
    }
  }

  return (
    <>
      <CheckoutSteps current="checkout" />
      {processingStep && <PaymentProcessingOverlay step={processingStep} />}

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Bag", href: "/cart" },
            { label: "Checkout" },
          ]}
        />

        <div className="mt-6 flex gap-4 border-b border-border-subtle pb-6">
          <button
            type="button"
            onClick={() => setCheckoutStep("delivery")}
            className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
              checkoutStep === "delivery" ? "text-brand-primary" : "text-text-muted hover:text-foreground"
            }`}
          >
            1. Delivery
          </button>
          <span className="text-text-subtle">/</span>
          <button
            type="button"
            onClick={() => checkoutStep === "payment" || (validateDelivery() && setCheckoutStep("payment"))}
            className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
              checkoutStep === "payment" ? "text-brand-primary" : "text-text-muted hover:text-foreground"
            }`}
          >
            2. Payment
          </button>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {checkoutStep === "delivery" ? (
              <form onSubmit={handleContinueToPayment}>
                <SectionHeading title="Delivery Details" subtitle="Where should we send your order?" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      Full Name
                    </label>
                    <Input
                      required
                      value={shipping.fullName}
                      onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      Email
                    </label>
                    <Input
                      required
                      type="email"
                      value={shipping.email}
                      onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      Phone
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="10-digit mobile"
                      value={shipping.phone}
                      onChange={(e) =>
                        setShipping({ ...shipping, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      Address
                    </label>
                    <Input
                      required
                      value={shipping.addressLine1}
                      onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      City
                    </label>
                    <Input
                      required
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      State
                    </label>
                    <Input
                      required
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-text-muted">
                      Pincode
                    </label>
                    <Input
                      required
                      value={shipping.pincode}
                      onChange={(e) =>
                        setShipping({ ...shipping, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                      }
                    />
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="mt-8">
                  Continue to Payment
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <SectionHeading title="Payment" subtitle="Complete your purchase securely" />
                <div className="mt-6">
                  <PaymentForm
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    card={card}
                    onCardChange={setCard}
                    upiId={upiId}
                    onUpiChange={setUpiId}
                    fieldError={paymentError}
                  />
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCheckoutStep("delivery")}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
                    {isSubmitting ? "Processing..." : `Pay ${formatPrice(total)}`}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummaryPanel
              items={items}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              discount={discount}
              couponCode={applied?.coupon.code}
              total={total}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function OrderSummaryPanel({
  items,
  subtotal,
  deliveryFee,
  discount,
  couponCode,
  total,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
}) {
  return (
    <div className="sticky top-48 border border-border-subtle bg-surface p-6 premium-shadow">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Order Summary</p>
      <ul className="mt-6 max-h-64 space-y-4 overflow-y-auto">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl ?? buildPlaceholderImage(item.name, "#7A4E35", 60, 75)}
              alt={item.name}
              className="h-16 w-14 shrink-0 object-cover bg-surface-muted"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-foreground">{item.name}</p>
              <p className="mt-1 text-xs text-text-muted">
                Qty {item.quantity} · {formatPrice(item.price)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <CouponField subtotal={subtotal} />
      <div className="mt-6 space-y-2 border-t border-border-subtle pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Delivery</span>
          <span>{deliveryFee === 0 ? "Complimentary" : formatPrice(deliveryFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-brand-success">
            <span>Coupon ({couponCode})</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border-subtle pt-3 font-medium">
          <span>Total</span>
          <span className="font-display text-xl">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
