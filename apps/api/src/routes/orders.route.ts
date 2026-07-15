import { Router } from "express";
import { z } from "zod";
import type { Order, OrderItemWithProduct } from "cartmind-shared-types";
import { resolveCoupon } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { sendError, sendSuccess } from "../utils/response";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  deliveryFee: z.number().min(0).optional().default(0),
  couponCode: z.string().min(1).optional(),
});

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
  product_name: string;
  product_image_url: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  price: string;
  stock: number;
  image_url: string | null;
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

function toOrderItemWithProduct(row: OrderItemRow): OrderItemWithProduct {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    productName: row.product_name,
    productImageUrl: row.product_image_url,
  };
}

async function fetchOrderItems(orderIds: string[]): Promise<Map<string, OrderItemWithProduct[]>> {
  const itemsByOrder = new Map<string, OrderItemWithProduct[]>();
  if (orderIds.length === 0) return itemsByOrder;

  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
            p.name AS product_name, p.image_url AS product_image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ANY($1::uuid[])`,
    [orderIds],
  );

  for (const row of itemsResult.rows) {
    const item = toOrderItemWithProduct(row);
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return itemsByOrder;
}

ordersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const ordersResult = await pool.query<OrderRow>(
      `SELECT id, user_id, status, total_amount, created_at
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user?.sub],
    );

    const orderIds = ordersResult.rows.map((order) => order.id);
    const itemsByOrder = await fetchOrderItems(orderIds);

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

ordersRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const orderResult = await pool.query<OrderRow>(
      `SELECT id, user_id, status, total_amount, created_at
       FROM orders WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user?.sub],
    );

    if (orderResult.rowCount === 0) {
      sendError(res, "Order not found", 404);
      return;
    }

    const order = toOrder(orderResult.rows[0]);
    const itemsByOrder = await fetchOrderItems([order.id]);

    sendSuccess(res, { ...order, items: itemsByOrder.get(order.id) ?? [] });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", requireAuth, async (req, res, next) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid order payload", 400);
    return;
  }

  const { items, deliveryFee, couponCode } = parsed.data;
  const userId = req.user?.sub;

  if (!userId) {
    sendError(res, "Authentication required", 401);
    return;
  }

  const client = await pool.connect();
  let transactionActive = false;

  try {
    await client.query("BEGIN");
    transactionActive = true;

    const productIds = items.map((i) => i.productId);
    const productsResult = await client.query<ProductRow>(
      `SELECT id, name, price, stock, image_url FROM products WHERE id = ANY($1::uuid[])`,
      [productIds],
    );

    const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));

    let subtotal = 0;
    const lineItems: {
      productId: string;
      quantity: number;
      unitPrice: number;
      productName: string;
      productImageUrl: string | null;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        await client.query("ROLLBACK");
        transactionActive = false;
        sendError(res, `Product not found: ${item.productId}`, 400);
        return;
      }
      if (product.stock < item.quantity) {
        await client.query("ROLLBACK");
        transactionActive = false;
        sendError(res, `Insufficient stock for ${product.name}`, 400);
        return;
      }

      const unitPrice = Number(product.price);
      subtotal += unitPrice * item.quantity;
      lineItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        productName: product.name,
        productImageUrl: product.image_url,
      });
    }

    const totalBeforeDiscount = subtotal + deliveryFee;
    let totalAmount = totalBeforeDiscount;

    if (couponCode) {
      const couponResult = resolveCoupon(couponCode, subtotal);
      if (!couponResult.ok) {
        await client.query("ROLLBACK");
        transactionActive = false;
        sendError(res, couponResult.error, 400);
        return;
      }
      totalAmount = Math.max(0, totalBeforeDiscount - couponResult.discountAmount);
    }

    const orderResult = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, 'paid', $2)
       RETURNING id, created_at`,
      [userId, totalAmount.toFixed(2)],
    );

    const orderId = orderResult.rows[0].id;
    const createdAt = orderResult.rows[0].created_at.toISOString();
    const insertedItems: OrderItemWithProduct[] = [];

    for (const line of lineItems) {
      const itemResult = await client.query<{
        id: string;
        order_id: string;
        product_id: string;
        quantity: number;
        unit_price: string;
      }>(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, product_id, quantity, unit_price`,
        [orderId, line.productId, line.quantity, line.unitPrice.toFixed(2)],
      );

      await client.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
        line.quantity,
        line.productId,
      ]);

      const row = itemResult.rows[0];
      insertedItems.push({
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: Number(row.unit_price),
        productName: line.productName,
        productImageUrl: line.productImageUrl,
      });
    }

    await client.query("COMMIT");
    transactionActive = false;

    sendSuccess(
      res,
      {
        id: orderId,
        userId,
        status: "paid" as const,
        totalAmount,
        createdAt,
        items: insertedItems,
      },
      201,
    );
  } catch (err) {
    if (transactionActive) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    next(err);
  } finally {
    client.release();
  }
});
