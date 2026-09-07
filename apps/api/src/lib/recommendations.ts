import type { Product } from "cartmind-shared-types";
import { pool } from "../db/pool";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  image_url: string | null;
  stock: number;
  created_at: Date;
  score?: string;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    stock: row.stock,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getRecommendations(options: {
  limit: number;
  userId?: string;
  seedProductIds: string[];
  excludeIds: string[];
}): Promise<Product[]> {
  const { limit, userId, seedProductIds, excludeIds } = options;
  const exclude = [...new Set(excludeIds)];
  const seeds = [...new Set(seedProductIds)].filter((id) => !exclude.includes(id));

  const scored = new Map<string, number>();

  const similaritySeeds = [...new Set([...seeds])];
  if (similaritySeeds.length > 0) {
    try {
      const similar = await pool.query<{ similar_product_id: string; similarity: string }>(
        `SELECT similar_product_id, similarity
         FROM ml_product_similarity
         WHERE product_id = ANY($1::uuid[])
         ORDER BY similarity DESC
         LIMIT 30`,
        [similaritySeeds],
      );
      for (const row of similar.rows) {
        if (!exclude.includes(row.similar_product_id)) {
          scored.set(
            row.similar_product_id,
            (scored.get(row.similar_product_id) ?? 0) + Number(row.similarity) * 6,
          );
        }
      }
    } catch {
      // ml_product_similarity not populated yet (Python pipeline not run) — heuristics below still apply.
    }
  }

  if (userId) {
    const purchased = await pool.query<{ product_id: string }>(
      `SELECT DISTINCT oi.product_id
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = $1 AND o.status = 'paid'`,
      [userId],
    );
    for (const row of purchased.rows) {
      if (!exclude.includes(row.product_id)) {
        scored.set(row.product_id, (scored.get(row.product_id) ?? 0) + 5);
      }
    }

    if (purchased.rows.length > 0) {
      const purchasedIds = purchased.rows.map((r) => r.product_id);
      const coPurchased = await pool.query<{ product_id: string; freq: string }>(
        `SELECT oi2.product_id, count(*) AS freq
         FROM order_items oi1
         JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
         WHERE oi1.product_id = ANY($1::uuid[])
         GROUP BY oi2.product_id
         ORDER BY freq DESC
         LIMIT 30`,
        [purchasedIds],
      );
      for (const row of coPurchased.rows) {
        if (!exclude.includes(row.product_id)) {
          scored.set(row.product_id, (scored.get(row.product_id) ?? 0) + Number(row.freq) * 3);
        }
      }

      const categoryAffinity = await pool.query<{ category: string }>(
        `SELECT DISTINCT p.category
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = $1 AND o.status = 'paid'`,
        [userId],
      );
      if (categoryAffinity.rows.length > 0) {
        const categories = categoryAffinity.rows.map((r) => r.category);
        const categoryProducts = await pool.query<ProductRow>(
          `SELECT id, name, description, price, category, image_url, stock, created_at
           FROM products
           WHERE category = ANY($1::text[])
           ORDER BY created_at DESC
           LIMIT 20`,
          [categories],
        );
        for (const row of categoryProducts.rows) {
          if (!exclude.includes(row.id)) {
            scored.set(row.id, (scored.get(row.id) ?? 0) + 2);
          }
        }
      }
    }
  }

  if (seeds.length > 0) {
    const coPurchased = await pool.query<{ product_id: string; freq: string }>(
      `SELECT oi2.product_id, count(*) AS freq
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
       WHERE oi1.product_id = ANY($1::uuid[])
       GROUP BY oi2.product_id
       ORDER BY freq DESC
       LIMIT 20`,
      [seeds],
    );
    for (const row of coPurchased.rows) {
      if (!exclude.includes(row.product_id)) {
        scored.set(row.product_id, (scored.get(row.product_id) ?? 0) + Number(row.freq) * 4);
      }
    }

    const seedCategories = await pool.query<{ category: string }>(
      `SELECT DISTINCT category FROM products WHERE id = ANY($1::uuid[])`,
      [seeds],
    );
    if (seedCategories.rows.length > 0) {
      const related = await pool.query<ProductRow>(
        `SELECT id, name, description, price, category, image_url, stock, created_at
         FROM products
         WHERE category = ANY($1::text[]) AND id <> ALL($2::uuid[])
         ORDER BY created_at DESC
         LIMIT 15`,
        [seedCategories.rows.map((r) => r.category), seeds],
      );
      for (const row of related.rows) {
        if (!exclude.includes(row.id)) {
          scored.set(row.id, (scored.get(row.id) ?? 0) + 2);
        }
      }
    }
  }

  const trending = await pool.query<ProductRow & { order_count: string }>(
    `SELECT p.id, p.name, p.description, p.price, p.category, p.image_url, p.stock, p.created_at,
            count(oi.id) AS order_count
     FROM products p
     LEFT JOIN order_items oi ON oi.product_id = p.id
     GROUP BY p.id
     ORDER BY order_count DESC, p.created_at DESC
     LIMIT 30`,
  );
  for (const row of trending.rows) {
    if (!exclude.includes(row.id)) {
      scored.set(row.id, (scored.get(row.id) ?? 0) + Number(row.order_count ?? 0) + 1);
    }
  }

  const rankedIds = [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit);

  if (rankedIds.length === 0) {
    const fallback = await pool.query<ProductRow>(
      `SELECT id, name, description, price, category, image_url, stock, created_at
       FROM products
       WHERE id <> ALL($1::uuid[])
       ORDER BY created_at DESC
       LIMIT $2`,
      [exclude.length > 0 ? exclude : ["00000000-0000-0000-0000-000000000000"], limit],
    );
    return fallback.rows.map(toProduct);
  }

  const products = await pool.query<ProductRow>(
    `SELECT id, name, description, price, category, image_url, stock, created_at
     FROM products
     WHERE id = ANY($1::uuid[])`,
    [rankedIds],
  );

  const byId = new Map(products.rows.map((r) => [r.id, r]));
  return rankedIds.map((id) => byId.get(id)).filter((r): r is ProductRow => !!r).map(toProduct);
}
