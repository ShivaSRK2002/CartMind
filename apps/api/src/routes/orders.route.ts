import { Router } from "express";
import type { Order, OrderItem } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { sendSuccess } from "../utils/response";

export const ordersRouter = Router();

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total_amount: string;
  created_at: Date;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as Order["status"],
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at.toISOString(),
  };
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
  };
}

ordersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const ordersResult = await pool.query<OrderRow>(
      `SELECT id, user_id, status, total_amount, created_at
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user?.sub],
    );

    const orderIds = ordersResult.rows.map((order) => order.id);
    const itemsByOrder = new Map<string, OrderItem[]>();

    if (orderIds.length > 0) {
      const itemsResult = await pool.query<OrderItemRow>(
        `SELECT id, order_id, product_id, quantity, unit_price
         FROM order_items WHERE order_id = ANY($1::uuid[])`,
        [orderIds],
      );

      for (const row of itemsResult.rows) {
        const item = toOrderItem(row);
        const list = itemsByOrder.get(item.orderId) ?? [];
        list.push(item);
        itemsByOrder.set(item.orderId, list);
      }
    }

    const orders = ordersResult.rows.map((row) => {
      const order = toOrder(row);
      return { ...order, items: itemsByOrder.get(order.id) ?? [] };
    });

    const lifetimeTotal = orders
      .filter((order) => order.status === "paid")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    sendSuccess(res, { orders, lifetimeTotal });
  } catch (err) {
    next(err);
  }
});
