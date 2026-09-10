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
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
