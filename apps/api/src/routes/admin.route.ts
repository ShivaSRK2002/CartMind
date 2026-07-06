import { Router } from "express";
import type { AdminCustomerSummary } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendSuccess } from "../utils/response";

export const adminRouter = Router();

interface CustomerSummaryRow {
  id: string;
  name: string;
  email: string;
  order_count: string;
  lifetime_value: string | null;
}

function toCustomerSummary(row: CustomerSummaryRow): AdminCustomerSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    orderCount: Number(row.order_count),
    lifetimeValue: Number(row.lifetime_value ?? 0),
  };
}

adminRouter.get("/customers", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const result = await pool.query<CustomerSummaryRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         count(o.id) FILTER (WHERE o.status = 'paid') AS order_count,
         COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS lifetime_value
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id, u.name, u.email
       ORDER BY lifetime_value DESC`,
    );

    sendSuccess(res, { customers: result.rows.map(toCustomerSummary) });
  } catch (err) {
    next(err);
  }
});
