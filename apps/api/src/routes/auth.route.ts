import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { User } from "cartmind-shared-types";
import { pool } from "../db/pool";
import { signAuthToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { sendError, sendSuccess } from "../utils/response";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}

function toPublicUser(row: UserRow): Omit<User, "passwordHash"> {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User["role"],
    createdAt: row.created_at.toISOString(),
  };
}

authRouter.post("/register", async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid registration payload", 400);
    return;
  }

  const { email, password, name } = parsed.data;

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if ((existing.rowCount ?? 0) > 0) {
      sendError(res, "Email already registered", 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name],
    );

    const user = toPublicUser(result.rows[0]);
    const token = signAuthToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    sendSuccess(res, { user, token }, 201);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, "Invalid login payload", 400);
    return;
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query<UserRow & { password_hash: string }>(
      "SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = $1",
      [email],
    );

    const row = result.rows[0];
    if (!row) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    const passwordMatches = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatches) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    const user = toPublicUser(row);
    const token = signAuthToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    sendSuccess(res, { user, token });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query<UserRow>(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [req.user?.sub],
    );

    const row = result.rows[0];
    if (!row) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, { user: toPublicUser(row) });
  } catch (err) {
    next(err);
  }
});
