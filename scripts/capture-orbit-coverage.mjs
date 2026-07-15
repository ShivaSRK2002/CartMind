import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../docs/screenshots");
const coverageHtml = path.resolve(__dirname, "../apps/api/coverage/index.html");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto("http://localhost:3001/login", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
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
  await page.screenshot({ path: path.join(outDir, "orbit-dashboard.png") });
  console.log("saved orbit-dashboard.png");

  await page.evaluate(() => window.scrollTo(0, 780));
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(outDir, "orbit-dashboard-panels.png"),
  });
  console.log("saved orbit-dashboard-panels.png");

  await page.goto(pathToFileURL(coverageHtml).href, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "api-test-coverage.png") });
  console.log("saved api-test-coverage.png");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
