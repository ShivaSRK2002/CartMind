const SYSTEM_PROMPT = `You are Orbit AI, an e-commerce analytics assistant for multi-store retail dashboards.
Answer concisely using ONLY the provided store data. Give actionable recommendations.
Use bullet points when listing multiple items. Keep responses under 200 words unless asked for detail.`;

export interface GeminiResult {
  reply: string;
  model: string;
  usedFallback: boolean;
}

function buildFallbackReply(message: string, context: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("churn") || lower.includes("at-risk") || lower.includes("at risk")) {
    return (
      "Based on current ML scores, the At-Risk cohort shows elevated churn probability. " +
      "Prioritize win-back emails with personalized coupons (VELORA10) for users with high " +
      "checkout_abandoned events but zero recent payment_success. " +
      "Set a valid GEMINI_API_KEY for deeper AI analysis."
    );
  }

  if (lower.includes("abandon") || lower.includes("checkout")) {
    return (
      "Checkout abandonment trends suggest friction at the payment step. " +
      "Users with checkout_started but no payment_success are prime targets for cart-recovery nudges. " +
      "Consider simplifying the payment form and offering FUNKY50 for carts above ₹200."
    );
  }

  if (lower.includes("impulse") || lower.includes("product")) {
    return (
      "Impulse buyers respond to limited-time offers and flash deals. " +
      "Surface high-discount items on the Offers page and trigger wishlist_add follow-ups " +
      "within 24 hours of product_viewed events."
    );
  }

  return (
    `Insight for "${message}": Review the behavioral event breakdown and ML risk scores in context. ` +
    `Key signals: ${context.split("\n").slice(0, 8).join(" | ")}. ` +
    "Set a valid GEMINI_API_KEY to enable full Gemini analysis."
  );
}

export async function generateInsight(message: string, context: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  if (!apiKey) {
    return {
      reply: buildFallbackReply(message, context),
      model: "rule-based-fallback",
      usedFallback: true,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n--- STORE DATA ---\n${context}\n\n--- ADMIN QUESTION ---\n${message}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error("Empty Gemini response");
    }

    return { reply: text, model: modelName, usedFallback: false };
  } catch (err) {
    // Surface the reason in the server logs so a misconfigured key / model is
    // diagnosable, then fall back so the feature is never unavailable.
    console.warn("[gemini] falling back to rule-based reply:", (err as Error).message);
    return {
      reply: buildFallbackReply(message, context),
      model: "rule-based-fallback",
      usedFallback: true,
    };
  }
}
