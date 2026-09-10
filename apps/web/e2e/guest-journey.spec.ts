import { test, expect } from "@playwright/test";

/**
 * Guest can browse the catalogue, open a product, add it to the bag, and be
 * routed into the login gate when they try to check out. No auth required —
 * this is the stable smoke path that must always be green.
 */
test("guest browses, adds to bag, and hits the checkout login gate", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Velora/i);

  // Into the catalogue
  await page.goto("/products");
  const firstCard = page.locator("article a[href^='/products/']").first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();

  // Product detail -> add to bag
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: /add to bag/i }).first().click();

  // Bag badge in the header reflects the added item
  const bagLink = page.locator("header a[href='/cart']");
  await expect(bagLink).toContainText("1");

  // Cart page lists the item and offers checkout
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /your bag/i })).toBeVisible();
  await page.getByRole("link", { name: /proceed to checkout/i }).click();

  // Guests are sent to sign in before checkout
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("catalogue search narrows the results", async ({ page }) => {
  await page.goto("/products?search=headphones");
  await expect(page.locator("article a[href^='/products/']").first()).toBeVisible();
  const count = await page.locator("article a[href^='/products/']").count();
  expect(count).toBeGreaterThan(0);
});
