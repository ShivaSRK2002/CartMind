import { test, expect } from "@playwright/test";

/**
 * Full happy path: a seeded customer signs in, adds a product, completes the
 * multi-step checkout with a demo card, and lands on the order confirmation.
 * Exercises the web -> Next API route -> Express API -> Postgres write path.
 */
test("seeded customer completes a checkout end to end", async ({ page }) => {
  // Sign in (seeded credentials from db/seed)
  await page.goto("/login?returnUrl=/products");
  await page.getByLabel(/email/i).fill("alice@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/products/);

  // Add the first product to the bag
  const firstCard = page.locator("article a[href^='/products/']").first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: /add to bag/i }).first().click();

  // Go to checkout
  await page.goto("/cart");
  await page.getByRole("link", { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // Delivery step — the form has no label/input associations, so fill by order:
  // 0 full name (prefilled), 1 email (prefilled), 2 phone, 3 address, 4 city,
  // 5 state, 6 pincode.
  const delivery = page.locator("form", { hasText: "Delivery Details" });
  await delivery.locator("input").nth(2).fill("9876543210");
  await delivery.locator("input").nth(3).fill("42 Residency Road");
  await delivery.locator("input").nth(4).fill("Bengaluru");
  await delivery.locator("input").nth(5).fill("Karnataka");
  await delivery.locator("input").nth(6).fill("560025");
  await page.getByRole("button", { name: /continue to payment/i }).click();

  // Payment step — quick-fill the succeeding demo card
  await page.getByRole("button", { name: /payment succeeds/i }).first().click();
  await page.getByRole("button", { name: /^pay /i }).click();

  // Order confirmation
  await expect(page).toHaveURL(/\/checkout\/confirmation\?orderId=/, { timeout: 30_000 });
  await expect(page.getByText(/your order is confirmed/i)).toBeVisible();
});
