import { Router } from "express";
import { z } from "zod";
import type { Product, ProductImage } from "cartmind-shared-types";
import { resolveCoupon } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { getRecommendations } from "../lib/recommendations";
import { optionalAuth } from "../middleware/optionalAuth";
import { sendError, sendSuccess } from "../utils/response";

export const productsRouter = Router();

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  image_url: string | null;
  stock: number;
  created_at: Date;
}

interface ProductImageRow {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: Date;
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

function toProductImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
    createdAt: row.created_at.toISOString(),
  };
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
  category: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  ids: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : [])),
});

const idParamSchema = z.string().uuid();

const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(6),
  seedProductIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : [])),
  excludeIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : [])),
});

productsRouter.get("/recommendations", optionalAuth, async (req, res, next) => {
  const parsed = recommendationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, "Invalid query parameters", 400);
    return;
  }

  try {
    const items = await getRecommendations({
      limit: parsed.data.limit,
      userId: req.user?.sub,
      seedProductIds: parsed.data.seedProductIds,
      excludeIds: parsed.data.excludeIds,
    });
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/", async (req, res, next) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, "Invalid query parameters", 400);
    return;
  }

  const { page, pageSize, category, search, ids } = parsed.data;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (ids.length > 0) {
    values.push(ids);
    conditions.push(`id = ANY($${values.length}::uuid[])`);
  }
  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query<{ count: string }>(
      `SELECT count(*) FROM products ${whereClause}`,
      values,
    );
    const total = Number(countResult.rows[0].count);

    const listValues = [...values, pageSize, offset];
    const itemsResult = await pool.query<ProductRow>(
      `SELECT id, name, description, price, category, image_url, stock, created_at
       FROM products
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
      listValues,
    );

    sendSuccess(res, {
      items: itemsResult.rows.map(toProduct),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  const parsedId = idParamSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    sendError(res, "Invalid product id", 400);
    return;
  }

  try {
    const productResult = await pool.query<ProductRow>(
      `SELECT id, name, description, price, category, image_url, stock, created_at
       FROM products WHERE id = $1`,
      [parsedId.data],
    );

    const row = productResult.rows[0];
    if (!row) {
      sendError(res, "Product not found", 404);
      return;
    }

    const imagesResult = await pool.query<ProductImageRow>(
      `SELECT id, product_id, image_url, display_order, created_at
       FROM product_images WHERE product_id = $1 ORDER BY display_order ASC`,
      [parsedId.data],
    );

    sendSuccess(res, {
      ...toProduct(row),
      images: imagesResult.rows.map(toProductImage),
    });
  } catch (err) {
    next(err);
  }
});
