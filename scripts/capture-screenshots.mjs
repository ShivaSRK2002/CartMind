import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../docs/screenshots");

const VIEWPORT = { width: 1440, height: 900 };

async function shot(page, name, options = {}) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: options.fullPage ?? false });
  console.log(`saved ${name}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // --- Velora storefront ---
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  await shot(page, "velora-home");

  await page.goto("http://localhost:3000/products", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, "velora-products");

  await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await shot(page, "velora-cart");

  // --- API health JSON ---
  await page.goto("http://localhost:4000/api/v1/health", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(400);
  await shot(page, "api-health");

  // --- API Swagger ---
  await page.goto("http://localhost:4000/api/docs/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  await shot(page, "api-swagger");

  // --- Orbit login + dashboard ---
  await page.goto("http://localhost:3001/login", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);
  await shot(page, "orbit-login");

  await page.fill("#email", "admin@cartmind.ai");
  await page.fill("#password", "password123");
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => !document.body.innerText.includes("Loading analytics"),
    { timeout: 60000 },
  );
  await page.waitForTimeout(1200);
  await shot(page, "orbit-dashboard");

  await page.evaluate(() => window.scrollTo(0, 780));
  await page.waitForTimeout(700);
  await shot(page, "orbit-dashboard-panels");

  await browser.close();
  console.log("All screenshots captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
