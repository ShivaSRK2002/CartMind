export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export interface TestCard {
  id: string;
  label: string;
  number: string;
  brand: CardBrand;
  outcome: "success" | "declined" | "insufficient";
}

export const TEST_CARDS: TestCard[] = [
  {
    id: "visa-success",
    label: "Visa — Payment succeeds",
    number: "4242424242424242",
    brand: "visa",
    outcome: "success",
  },
  {
    id: "mc-success",
    label: "Mastercard — Payment succeeds",
    number: "5555555555554444",
    brand: "mastercard",
    outcome: "success",
  },
  {
    id: "visa-decline",
    label: "Card declined",
    number: "4000000000000002",
    brand: "visa",
    outcome: "declined",
  },
  {
    id: "visa-insufficient",
    label: "Insufficient funds",
    number: "4000000000009995",
    brand: "visa",
    outcome: "insufficient",
  },
];

export function stripCardNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  const digits = stripCardNumber(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardBrand(number: string): CardBrand {
  const digits = stripCardNumber(number);
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "unknown";
}

export function getLast4(number: string): string {
  return stripCardNumber(number).slice(-4);
}

export function findTestCard(number: string): TestCard | undefined {
  const digits = stripCardNumber(number);
  return TEST_CARDS.find((card) => card.number === digits);
}

export interface PaymentValidationResult {
  ok: boolean;
  error?: string;
  testCard?: TestCard;
}

export function validateCardPayment(
  cardNumber: string,
  expiry: string,
  cvv: string,
  cardName: string,
): PaymentValidationResult {
  const digits = stripCardNumber(cardNumber);

  if (!cardName.trim()) {
    return { ok: false, error: "Please enter the name on card." };
  }
  if (digits.length < 15 || digits.length > 16) {
    return { ok: false, error: "Please enter a valid 16-digit card number." };
  }

  const expiryDigits = expiry.replace(/\D/g, "");
  if (expiryDigits.length !== 4) {
    return { ok: false, error: "Please enter expiry as MM/YY." };
  }

  const month = Number(expiryDigits.slice(0, 2));
  const year = Number(`20${expiryDigits.slice(2, 4)}`);
  const now = new Date();
  const expiryDate = new Date(year, month, 0);

  if (month < 1 || month > 12) {
    return { ok: false, error: "Invalid expiry month." };
  }
  if (expiryDate < now) {
    return { ok: false, error: "This card has expired." };
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return { ok: false, error: "Please enter a valid CVV." };
  }

  const testCard = findTestCard(digits);
  if (!testCard) {
    return {
      ok: false,
      error: "Unrecognized test card. Use 4242 4242 4242 4242 or pick a demo card below.",
    };
  }

  if (testCard.outcome === "declined") {
    return { ok: false, error: "Your card was declined. Try 4242 4242 4242 4242." };
  }
  if (testCard.outcome === "insufficient") {
    return { ok: false, error: "Insufficient funds on this test card." };
  }

  return { ok: true, testCard };
}

export function validateUpiPayment(upiId: string): PaymentValidationResult {
  const trimmed = upiId.trim();
  if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid UPI ID (e.g. name@upi)." };
  }
  return { ok: true };
}

export function simulatePaymentDelay(ms = 2200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
