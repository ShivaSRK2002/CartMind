import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const html = path.resolve("apps/api/coverage/index.html");
const out = path.resolve("docs/screenshots/api-test-coverage.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
