import { Router } from "express";
import type { Banner } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { sendSuccess } from "../utils/response";

export const bannersRouter = Router();

interface BannerRow {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

function toBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

bannersRouter.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query<BannerRow>(
      `SELECT id, title, image_url, link_url, display_order, is_active, created_at
       FROM banners
       WHERE is_active = true
       ORDER BY display_order ASC`,
    );

    sendSuccess(res, { items: result.rows.map(toBanner) });
  } catch (err) {
    next(err);
  }
});
