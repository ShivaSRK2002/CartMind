import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { buildPlaceholderImage, colorForCategory, shadeColor } from "./placeholder-image";

const SEED_FILE = path.resolve(__dirname, "../../../../db/seed/seed.sql");

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const ORDERS_PER_CUSTOMER_MIN = 20;
const ORDERS_PER_CUSTOMER_MAX = 30;
const GALLERY_SHADE_STEPS = [0, 15, -15];

interface ProductRow {
  id: string;
  price: string;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOrderStatus(): "paid" | "cancelled" | "pending" {
  const roll = Math.random();
  if (roll < 0.85) return "paid";
  if (roll < 0.95) return "cancelled";
  return "pending";
}

function randomPastDate(): Date {
  return new Date(Date.now() - Math.random() * THREE_YEARS_MS);
}

async function seedProductImagePlaceholders(pool: Pool): Promise<void> {
  const { rows: products } = await pool.query<{ id: string; name: string; category: string }>(
    "SELECT id, name, category FROM products",
  );

  for (const product of products) {
    const baseColor = colorForCategory(product.category);
    const primaryImage = buildPlaceholderImage(product.name, baseColor, 400, 400);

    await pool.query("UPDATE products SET image_url = $1 WHERE id = $2", [primaryImage, product.id]);

    const params: unknown[] = [];
    const placeholders: string[] = [];

    GALLERY_SHADE_STEPS.forEach((shadePercent, i) => {
      const galleryImage = buildPlaceholderImage(
        product.name,
        shadeColor(baseColor, shadePercent),
        800,
        800,
      );
      const base = i * 3;
      params.push(product.id, galleryImage, i);
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    });

    await pool.query(
      `INSERT INTO product_images (product_id, image_url, display_order) VALUES ${placeholders.join(", ")}`,
      params,
    );
  }
}

const BANNER_CATEGORIES = ["Electronics", "Apparel", "Home & Kitchen", "Sports & Outdoors"];

async function seedBannerImagePlaceholders(pool: Pool): Promise<void> {
  const { rows: banners } = await pool.query<{ id: string; title: string }>(
    "SELECT id, title FROM banners ORDER BY display_order ASC",
  );

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const category = BANNER_CATEGORIES[i] ?? BANNER_CATEGORIES[0];
    const image = buildPlaceholderImage(banner.title, colorForCategory(category), 1200, 400);
    await pool.query("UPDATE banners SET image_url = $1 WHERE id = $2", [image, banner.id]);
  }
}

async function seedOrderHistory(pool: Pool): Promise<void> {
  const { rows: customers } = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE role = 'customer'",
  );
  const { rows: products } = await pool.query<ProductRow>("SELECT id, price FROM products");

  for (const customer of customers) {
    const orderCount = randomInt(ORDERS_PER_CUSTOMER_MIN, ORDERS_PER_CUSTOMER_MAX);

    for (let i = 0; i < orderCount; i++) {
      const createdAt = randomPastDate();
      const status = randomOrderStatus();
      const itemCount = randomInt(1, 4);

      const items = Array.from({ length: itemCount }, () => {
        const product = products[randomInt(0, products.length - 1)];
        return {
          productId: product.id,
          quantity: randomInt(1, 3),
          unitPrice: Number(product.price),
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      const orderResult = await pool.query<{ id: string }>(
        `INSERT INTO orders (user_id, status, total_amount, created_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [customer.id, status, totalAmount.toFixed(2), createdAt],
      );
      const orderId = orderResult.rows[0].id;

      const params: unknown[] = [];
      const placeholders: string[] = [];
      items.forEach((item, index) => {
        const base = index * 4;
        params.push(orderId, item.productId, item.quantity, item.unitPrice);
        placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      });

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ${placeholders.join(", ")}`,
        params,
      );
    }
  }
}

const RECENT_EVENT_DAYS = 45;
const SEARCH_TERMS = ["headphones", "denim jacket", "coffee", "running shoes", "desk lamp", "backpack", "yoga mat"];

function daysAgo(maxDays: number): Date {
  return new Date(Date.now() - Math.random() * maxDays * 24 * 60 * 60 * 1000);
}

interface EventSeed {
  type: string;
  userId: string | null;
  sessionId: string;
  anonymousId: string | null;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

/**
 * Generates a realistic first-party behavioral event stream so the dashboards
 * (event breakdown, engagement heatmap + depth funnel, conversion rate) and
 * the ML feature aggregates have signal on a fresh database. Sessions mirror
 * real shopper journeys: browse-only, browse -> cart -> abandon, and full
 * browse -> cart -> checkout -> purchase, concentrated in the last 45 days.
 */
async function seedBehavioralEvents(pool: Pool): Promise<void> {
  const { rows: customers } = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE role = 'customer'",
  );
  const { rows: products } = await pool.query<ProductRow>("SELECT id, price FROM products");
  const { rows: recentOrders } = await pool.query<{ id: string; user_id: string; created_at: Date }>(
    `SELECT o.id, o.user_id, o.created_at
     FROM orders o
     WHERE o.status = 'paid' AND o.created_at >= now() - interval '${RECENT_EVENT_DAYS} days'`,
  );

  const events: EventSeed[] = [];
  const pick = () => products[randomInt(0, products.length - 1)];

  // 1. Purchase sessions — reconstructed from recent paid orders
  for (const order of recentOrders) {
    const { rows: items } = await pool.query<{ product_id: string }>(
      "SELECT product_id FROM order_items WHERE order_id = $1",
      [order.id],
    );
    const session = `seed-buy-${order.id.slice(0, 8)}`;
    const t = new Date(order.created_at);
    const step = (mins: number) => new Date(t.getTime() + mins * 60_000);

    for (let v = 0; v < items.length + randomInt(1, 4); v++) {
      const p = items[v]?.product_id ?? pick().id;
      events.push({ type: "product_viewed", userId: order.user_id, sessionId: session, anonymousId: null, payload: { productId: p }, occurredAt: step(v) });
    }
    for (const item of items) {
      events.push({ type: "add_to_cart", userId: order.user_id, sessionId: session, anonymousId: null, payload: { productId: item.product_id, quantity: 1 }, occurredAt: step(items.length + 2) });
    }
    if (Math.random() < 0.3) {
      events.push({ type: "coupon_applied", userId: order.user_id, sessionId: session, anonymousId: null, payload: { code: "VELORA10" }, occurredAt: step(items.length + 3) });
    }
    events.push({ type: "checkout_started", userId: order.user_id, sessionId: session, anonymousId: null, payload: { itemCount: items.length }, occurredAt: step(items.length + 4) });
    events.push({ type: "payment_success", userId: order.user_id, sessionId: session, anonymousId: null, payload: { orderId: order.id }, occurredAt: step(items.length + 6) });
  }

  // 1b. Synthetic recent purchase sessions (events only — keeps the 30-day
  // conversion funnel populated regardless of how the order dates fell).
  for (let i = 0; i < 70; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const session = `seed-purchase-${i}`;
    const t = daysAgo(28);
    const step = (mins: number) => new Date(t.getTime() + mins * 60_000);
    const views = randomInt(2, 6);
    for (let v = 0; v < views; v++) {
      events.push({ type: "product_viewed", userId: customer.id, sessionId: session, anonymousId: null, payload: { productId: pick().id }, occurredAt: step(v) });
    }
    const bought = pick();
    events.push({ type: "add_to_cart", userId: customer.id, sessionId: session, anonymousId: null, payload: { productId: bought.id, quantity: 1 }, occurredAt: step(views + 1) });
    events.push({ type: "checkout_started", userId: customer.id, sessionId: session, anonymousId: null, payload: {}, occurredAt: step(views + 2) });
    events.push({ type: "payment_success", userId: customer.id, sessionId: session, anonymousId: null, payload: { amount: Number(bought.price) }, occurredAt: step(views + 4) });
  }

  // 2. Cart-abandonment sessions
  const abandonCount = Math.max(60, recentOrders.length);
  for (let i = 0; i < abandonCount; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const session = `seed-abandon-${i}`;
    const t = daysAgo(RECENT_EVENT_DAYS);
    const step = (mins: number) => new Date(t.getTime() + mins * 60_000);
    const views = randomInt(1, 5);
    for (let v = 0; v < views; v++) {
      events.push({ type: "product_viewed", userId: customer.id, sessionId: session, anonymousId: null, payload: { productId: pick().id }, occurredAt: step(v) });
    }
    events.push({ type: "add_to_cart", userId: customer.id, sessionId: session, anonymousId: null, payload: { productId: pick().id, quantity: 1 }, occurredAt: step(views + 1) });
    if (Math.random() < 0.6) {
      events.push({ type: "checkout_started", userId: customer.id, sessionId: session, anonymousId: null, payload: {}, occurredAt: step(views + 2) });
      events.push({ type: "checkout_abandoned", userId: customer.id, sessionId: session, anonymousId: null, payload: { stage: "payment" }, occurredAt: step(views + 4) });
    } else {
      events.push({ type: "remove_from_cart", userId: customer.id, sessionId: session, anonymousId: null, payload: { productId: pick().id }, occurredAt: step(views + 3) });
    }
  }

  // 3. Browse-only + search + wishlist sessions (anonymous and known)
  for (let i = 0; i < 120; i++) {
    const known = Math.random() < 0.5;
    const customer = customers[randomInt(0, customers.length - 1)];
    const session = `seed-browse-${i}`;
    const anon = known ? null : `anon-${i}`;
    const userId = known ? customer.id : null;
    const t = daysAgo(RECENT_EVENT_DAYS);
    const step = (mins: number) => new Date(t.getTime() + mins * 60_000);
    if (Math.random() < 0.5) {
      events.push({ type: "search_query", userId, sessionId: session, anonymousId: anon, payload: { query: SEARCH_TERMS[randomInt(0, SEARCH_TERMS.length - 1)] }, occurredAt: step(0) });
    }
    for (let v = 0; v < randomInt(1, 6); v++) {
      events.push({ type: "product_viewed", userId, sessionId: session, anonymousId: anon, payload: { productId: pick().id }, occurredAt: step(v + 1) });
    }
    if (known && Math.random() < 0.4) {
      events.push({ type: "wishlist_add", userId, sessionId: session, anonymousId: null, payload: { productId: pick().id }, occurredAt: step(8) });
    }
  }

  // Bulk insert in chunks
  const CHUNK = 200;
  for (let i = 0; i < events.length; i += CHUNK) {
    const slice = events.slice(i, i + CHUNK);
    const params: unknown[] = [];
    const rows = slice.map((e, j) => {
      const b = j * 6;
      params.push(e.type, e.userId, e.sessionId, e.anonymousId, JSON.stringify(e.payload), e.occurredAt);
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6})`;
    });
    await pool.query(
      `INSERT INTO events (event_type, user_id, session_id, anonymous_id, payload, occurred_at) VALUES ${rows.join(", ")}`,
      params,
    );
  }
  console.log(`Behavioral events seeded (${events.length} across ${RECENT_EVENT_DAYS} days).`);
}

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const sql = await readFile(SEED_FILE, "utf-8");
    await pool.query(sql);
    console.log("Base seed data applied (users, products, banners).");

    await seedProductImagePlaceholders(pool);
    console.log("Product images seeded.");

    await seedBannerImagePlaceholders(pool);
    console.log("Banner images seeded.");

    await seedOrderHistory(pool);
    console.log("3 years of order history seeded.");

    await seedBehavioralEvents(pool);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
